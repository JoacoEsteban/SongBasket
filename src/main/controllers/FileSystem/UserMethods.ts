/* eslint-disable new-cap */
import customGetters from '../../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import Helpers from './Helpers'
import REGEX from '../../Global/REGEX'
import { promises as fs } from 'fs'
import * as fsCb from 'fs'
import * as PATH from 'path'
import * as rimraf from 'rimraf'
// import NodeID3 from 'node-id3'
import * as iconv from 'iconv-lite'
type sessionPaths = typeof global.SESSION_FOLDER_PATHS

const PATHS = {
  userDataPath: global.CONSTANTS.APP_SUPPORT_PATH,
  get foldersJsonPath () {
    return PATH.join(this.userDataPath, '.songbasket-folders')
  },
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
  async getFolders (): Promise<sessionPaths | null> {
    if (await utils.pathDoesExist(PATHS.foldersJsonPath)) {
      let paths: sessionPaths = JSON.parse(await fs.readFile(PATHS.foldersJsonPath, 'utf8'))
      if (!this.isValidFolderStructure(paths)) paths = await this.resetFolderPaths()
      return global.SESSION_FOLDER_PATHS = paths
    }
    return null // TODO return safe
  },
  isValidFolderStructure (paths: sessionPaths) {
    const them = Object.keys(paths)
    const def = Object.keys(getEmptyFolders())
    return them.length === def.length && them.every(key => def.includes(key))
  },
  async setCurrentFolder (path: string | null) {
    if (!path) path = null
    global.SESSION_FOLDER_PATHS.selected = path
    await this.writeHomeFolders()
  },
  async addFolder (path: string, params = { set: true }) {
    console.log('path', path)
    const folders = await this.getFolders()
    if (!folders) return
    if (!folders.paths.find(p => p === path)) folders.paths.push(path)
    global.SESSION_FOLDER_PATHS = folders

    if (params.set) await this.setCurrentFolder(path)
    else this.writeHomeFolders()
  },
  async removeFolder (path: string) {
    const folders = await this.getFolders()
    if (!folders) return
    folders.paths = folders.paths.filter(p => p !== path)
    if (path === folders.selected) folders.selected = null
    global.SESSION_FOLDER_PATHS = folders
    this.writeHomeFolders()
  },
  async unsetCurrentFolder (path: string) {
    const folders = await this.getFolders()
    if (!folders) return
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
  async writeHomeFolders (folders = global.SESSION_FOLDER_PATHS) {
    try {
      await fs.writeFile(PATHS.foldersJsonPath, JSON.stringify(folders), 'utf8')
      global.SESSION_FOLDER_PATHS = folders
      return 'success'
    } catch (err) {
      throw err
    }
  },
  async saveState (params: { state: any, path: string }) {
    const { state, path } = params
    // console.log('Saving state to', path)
    if (!(await utils.pathDoesExist(path))) {
      // TODO Handle non existing folder
    } else {
      const jsonState = JSON.stringify(state)
      await fs.writeFile(PATH.join(path, PATHS.stateFileName), jsonState, 'utf8')
    }
  },
  async retrieveState (path: string) {
    let filePath = path + PATHS.stateFileName
    console.log('retrieving from ', path)
    await fs.access(filePath)
    const data: string = await fs.readFile(filePath, 'utf-8')
    try {
      return JSON.parse(data)
    } catch (err) {
      console.error('ERROR WHEN PARSING STATE JSON FILE::: FileSystem/index.js', err)
      throw err
    }
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
  async renameFolder (params: { oldName: string, newName: string }) {
    let { oldName, newName } = params
    newName = utils.encodeIntoFilename(newName)
    oldName = utils.encodeIntoFilename(oldName)

    const base = homeFolderPath() + '/'
    const oldPath = PATH.join(base, oldName)
    const newPath = PATH.join(base, newName)
    if (!await utils.pathDoesExist(oldPath)) return

    console.log('RENAMING FOLDER: ' + oldName + ' => ' + newName)
    await fs.rename(oldPath, newPath)
  },
  retrieveMP3FileTags (path: string) {
    return new Promise((resolve, reject) => { // TODO
      fsCb.open(path, 'r', function (err, fd) {
        if (err) return reject(err)

        fsCb.fstat(fd, function (err, stats) {
          if (err) return closeFile(fd, err, null)

          const max = 1024
          let bufferSize = stats.size < max ? stats.size : max
          let buffer = new Buffer.alloc(bufferSize)

          fsCb.read(fd, buffer, 0, bufferSize, 0, () => {
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

      function giveMeTagLength (name: 'songbasket_spotify_id' | 'songbasket_youtube_id') {
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
  async checkPathThenCreate (path: string) {
    let pathExists = await utils.pathDoesExist(path)
    if (!pathExists) await fs.mkdir(path)
    return pathExists
  }
}

export default UserMethods
