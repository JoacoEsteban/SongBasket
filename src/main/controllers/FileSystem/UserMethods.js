/* eslint-disable new-cap */
import customGetters from '../../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import Helpers from './Helpers'
import REGEX from '../../Global/REGEX'
const electron = require('electron')
const fs = require('fs')
const PATH = require('path')
const rimraf = require('rimraf')
// const NodeID3 = require('node-id3')
const iconv = require('iconv-lite')

const PATHS = {
  userDataPath: (electron.app || electron.remote.app).getPath('userData') + '/',
  get foldersJsonPath () { return this.userDataPath + '.songbasket-folders' },
  stateFileName: '/.songbasket'
}

const getEmptyFolders = () => ({ paths: [], selected: null })

global.CONSTANTS.APP_STATUS.FOLDERS = getEmptyFolders()

Object.defineProperties(global, {
  SESSION_FOLDER_PATHS: {
    get: function () {
      return global.CONSTANTS.APP_STATUS.FOLDERS
    },
    set: function (paths) {
      global.CONSTANTS.APP_STATUS.FOLDERS = paths
    }
  },
  HOME_FOLDER: {
    get: function () {
      return global.CONSTANTS.APP_STATUS.FOLDERS.selected
    }
  }
})

console.log('Folder Path: ', PATHS.foldersJsonPath)
const homeFolderPath = () => global.HOME_FOLDER

const UserMethods = {
  async getFolders () {
    try {
      if (await utils.pathDoesExist(PATHS.foldersJsonPath)) {
        let paths = JSON.parse((await utils.promisify(fs.readFile, [PATHS.foldersJsonPath, 'utf8']))[1])
        if (!this.isValidFolderStructure(paths)) paths = await this.resetFolderPaths()
        return global.SESSION_FOLDER_PATHS = paths
      }
    } catch (error) {
      throw error
    }
  },
  isValidFolderStructure (paths) {
    const them = Object.keys(paths)
    const def = Object.keys(getEmptyFolders())
    return them.length === def.length && them.every(key => def.includes(key))
  },
  async setCurrentFolder (path) {
    if (!path) path = null
    global.SESSION_FOLDER_PATHS.selected = path
    await this.writeHomeFolders()
  },
  async addFolder (path, params = { set: true }) {
    console.log('path', path)
    const folders = await this.getFolders()
    if (!folders.paths.find(p => p === path)) folders.paths.push(path)
    global.SESSION_FOLDER_PATHS = folders

    if (params.set) await this.setCurrentFolder(path)
    else this.writeHomeFolders()
  },
  async removeFolder (path) {
    const folders = await this.getFolders()
    folders.paths = folders.paths.filter(p => p !== path)
    if (path === folders.selected) folders.selected = null
    global.SESSION_FOLDER_PATHS = folders
    this.writeHomeFolders()
  },
  async unsetCurrentFolder (path) {
    const folders = await this.getFolders()
    folders.selected = null
    global.SESSION_FOLDER_PATHS = folders
    await this.writeHomeFolders()
  },
  async retrieveFolders () {
    try {
      let folders = await this.getFolders()
      if (!folders) {
        console.log('Folder paths file missing, Creating')
        folders = await this.resetFolderPaths()
      }
      return folders
    } catch (error) {
      console.error('ERROR WHEN FOLDER PATHS JSON FILE::: FileSystem/index.js', PATHS.foldersJsonPath, error)
    }
  },
  async resetFolderPaths () {
    try {
      const emptyFolders = getEmptyFolders()
      await this.writeHomeFolders(emptyFolders)
      return emptyFolders
    } catch (error) {
      throw error
    }
  },
  writeHomeFolders: async function (folders = global.SESSION_FOLDER_PATHS) {
    try {
      await utils.promisify(fs.writeFile, [PATHS.foldersJsonPath, JSON.stringify(folders), 'utf8'])
      global.SESSION_FOLDER_PATHS = folders
      return 'success'
    } catch (err) {
      throw err
    }
  },
  saveState: async function ({ state, path }) {
    // console.log('Saving state to', path)
    return new Promise(async (resolve, reject) => {
      if (!(await utils.pathDoesExist(path))) {
        // TODO Handle non existing folder
      } else {
        let jsonState = JSON.stringify(state)
        try {
          let err = await (utils.promisify(fs.writeFile, [path + PATHS.stateFileName, jsonState, 'utf8']))[0]
          err ? reject(err) : resolve()
        } catch (error) {
          reject(error)
        }
      }
    })
  },
  retrieveState: function (path) {
    let filePath = path + PATHS.stateFileName
    console.log('retrieving from ', path)
    return new Promise((resolve, reject) => {
      fs.access(filePath, (err) => {
        if (err) return reject(err)
        fs.readFile(filePath, (err, data) => {
          if (err) return reject(err)
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            console.error('ERROR WHEN PARSING STATE JSON FILE::: FileSystem/index.js', err)
            reject(err)
          }
        })
      })
    })
  },
  retrieveLocalTracks (plFilter = false) {
    return new Promise(async (resolve, reject) => {
      let syncedPlaylists = customGetters.SyncedPlaylistsSp().filter(pl => plFilter ? plFilter.includes(pl.id) : true).map(pl => ({ id: pl.id, path: PATH.join((homeFolderPath()), utils.encodeIntoFilename(pl.folderName || pl.name)) }))
      let processedPls = 0
      let allTracks = []

      const checkNResolve = () => (++processedPls === syncedPlaylists.length) && resolve(allTracks)
      if (!syncedPlaylists.length) --processedPls && checkNResolve()

      for (let pl of syncedPlaylists) {
        if (!await this.checkPathThenCreate(pl.path)) checkNResolve()
        else {
          // Get all files from playlist dir
          fs.readdir(pl.path, function (err, filenames) {
            if (err) return reject(err)
            filenames = filenames.filter(f => REGEX.mp3File.test(f)) // filter to just MP3 files
            if (!filenames.length) checkNResolve()
            else {
              let processedTracks = 0
              filenames.forEach(file => {
                const filePath = PATH.join(pl.path, file)
                UserMethods.retrieveMP3FileTags(filePath)
                  .then(tags => {
                    if (tags) allTracks.push((() => {
                      const track = {
                        playlist: pl.id,
                        path: filePath,
                        file: file
                      }
                      tags.forEach(tag => {
                        track[tag.name] = tag.value
                      })

                      return track
                    })())
                    if (++processedTracks === filenames.length) checkNResolve()
                  })
                  .catch(err => reject(err)) // TODO Handle error
              })
            }
          })
        }
      }
    })
  },
  deletePlaylist (playlistName, callback) {
    return new Promise((resolve, reject) => {
      playlistName = utils.encodeIntoFilename(playlistName)
      rimraf(homeFolderPath() + '/' + playlistName, function (err) {
        if (err) return reject(err)
        console.log('Playlist ' + playlistName + ' Deleted')
        resolve()
      })
    })
  },
  renameFolder ({ oldName, newName }) {
    return new Promise(async (resolve, reject) => {
      newName = utils.encodeIntoFilename(newName)
      oldName = utils.encodeIntoFilename(oldName)
      let base = homeFolderPath() + '/'
      if (!await utils.pathDoesExist(base + oldName)) return
      console.log('RENAMING FOLDER: ' + oldName + ' => ' + newName)
      fs.rename(base + oldName, base + newName, (err) => err ? reject(err) : resolve())
    })
  },
  retrieveMP3FileTags (path) {
    return new Promise((resolve, reject) => {
      fs.open(path, 'r', function (err, fd) {
        if (err) return reject(err)

        fs.fstat(fd, function (err, stats) {
          if (err) return closeFile(fd, err, null)

          const max = 1024
          let bufferSize = stats.size < max ? stats.size : max
          let buffer = new Buffer.alloc(bufferSize)

          fs.read(fd, buffer, 0, bufferSize, 0, () => {
            let headerPointer = buffer.indexOf('TXXX')
            // Track doesn't contain SB tags
            if (headerPointer === -1) return closeFile(fd, null, null)

            // let tagSize = 57*3 + 13
            let tagsBuffer = new Buffer.alloc(bufferSize - headerPointer)

            buffer.copy(tagsBuffer, 0, headerPointer)

            let fileContents = (iconv.decode(tagsBuffer, 'ISO-8859-1').replace(/\0/g, ''))
            fileContents = fileContents.substring(fileContents.indexOf('songbasket'))
            let tagPosition = fileContents.indexOf('songbasket')
            let tags = tagPosition === -1 ? null : []

            for (null; tagPosition !== -1; tagPosition = fileContents.indexOf('songbasket')) {
              let tagObj = {}

              let tagEnd = fileContents.substring(tagPosition).indexOf('ÿþ')
              tagObj.name = fileContents.slice(tagPosition, tagEnd)
              fileContents = fileContents.substring(tagEnd + 2)

              let tagLength = giveMeTagLength(tagObj.name)
              tagObj.value = fileContents.substring(0, tagLength)
              fileContents = fileContents.substring(fileContents.indexOf('songbasket'))

              tags.push(tagObj)
            }
            closeFile(fd, null, tags)
          })
        })
      })

      function giveMeTagLength (name) {
        switch (name) {
          case 'songbasket_spotify_id':
            return 22
          case 'songbasket_youtube_id':
            return 11
          default:
            return -1
        }
      }
      function closeFile (fd, err, tags) {
        fs.close(fd, () => {
          if (err) reject(err)
          else resolve(tags)
        })
      }
    })
  },
  async setFolderIcons (plFilter, params = { force: false }) {
    if (typeof plFilter === 'string') plFilter = [plFilter]
    if (!Array.isArray(plFilter)) plFilter = null

    const iconSetter = Helpers.getIconSetterHelper()
    if (!iconSetter) return console.error('NO ICONSETTER FOR THIS PLATFORM')
    const pls = customGetters.SyncedPlaylistsSp_SAFE().filter(p => !plFilter || plFilter.includes(p.id)).map(({ folderName, name, images }) => ({ path: PATH.join((homeFolderPath()), utils.encodeIntoFilename(folderName || name)).replace(/ /g, '\\ '), imageUrl: images && images[0] && images[0].url })).filter(pl => pl.path && pl.imageUrl)

    pls.forEach(async pl => {
      if (!params.force && await iconSetter.test(pl.path)) return
      const downloader = new Helpers.plIconDownloader(pl, iconSetter)
      downloader.exec()
    })
  },
  async checkPathThenCreate (path) {
    let pathExists = await utils.pathDoesExist(path)
    if (!pathExists) await utils.promisify(fs.mkdir, path)
    return pathExists
  }
}

export default UserMethods
