/* eslint-disable new-cap */
import customGetters from '../../renderer/store/customGetters'
import * as utils from '../../MAIN_PROCESS_UTILS'
const electron = require('electron')
const fs = require('fs')
const rimraf = require('rimraf')
// const NodeID3 = require('node-id3')
const iconv = require('iconv-lite')

const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/'
const foldersJsonPath = userDataPath + '.songbasket-folders'
const stateFileName = '/.songbasket'
console.log('Folder Path: ', foldersJsonPath)

const homeFolderPath = () => global.HOME_FOLDER

const userMethods = {
  checkForUser: function () {
    if (fs.existsSync(foldersJsonPath)) return JSON.parse(fs.readFileSync(foldersJsonPath, 'utf8'))

    console.log('Folder paths file missing, Creating')
    let emptyFolders = {paths: [], selected: null}
    fs.writeFileSync(foldersJsonPath, JSON.stringify(emptyFolders), 'utf8')
    return (emptyFolders)
  },
  writeHomeFolders: async function (folders) {
    try {
      await fs.writeFile(foldersJsonPath, JSON.stringify(folders))
      return 'success'
    } catch (err) {
      throw err
    }
  },
  saveState: function ({state, path}) {
    // console.log('Saving state to', path)
    return new Promise((resolve, reject) => {
      let exists = fs.existsSync(path)
      if (!exists) {
        // TODO Handle non existing folder
      } else {
        let jsonState = JSON.stringify(state)
        fs.writeFile(path + stateFileName, jsonState, 'utf8', (err) => {
          if (err) reject(err)
          else resolve()
        })
      }
    })
  },
  retrieveState: function (path) {
    let filePath = path + stateFileName
    console.log('retrieving from ', path)
    return new Promise((resolve, reject) => {
      fs.access(filePath, (err) => {
        if (err) reject(err)
        else {
          fs.readFile(filePath, (err, data) => {
            if (err) reject(err)
            resolve(JSON.parse(data))
          })
        }
      })
    })
  },
  checkDownloadPaths () {
    return new Promise((resolve, reject) => {
      let syncedPlaylists = customGetters.SyncedPlaylistsSp()
      let processedPls = 0
      let allTracks = []

      function checkNResolve () {
        if (++processedPls === syncedPlaylists.length) resolve(allTracks)
      }
      for (let i = 0; i < syncedPlaylists.length; i++) {
        let pl = syncedPlaylists[i]
        pl = { id: pl.id, path: homeFolderPath() + '/' + utils.encodeIntoFilename(pl.name) }
        console.log('checked', pl)

        if (checkPathThenCreate(pl.path)) {
          // Get all files from playlist dir
          fs.readdir(pl.path, function (err, filenames) {
            if (err) {
              console.error('error reading path', pl.path)
              reject(err)
              return
            }
            filenames = filenames.filter(n => n.substr(n.length - 3) === 'mp3')
            if (filenames.length === 0) {
              checkNResolve()
            } else {
              // filter to just MP3 files
              // TODO Support FLAC, etc
              let processedTracks = 0
              // cycle throug tracks and store SB ones
              for (let o = 0; o < filenames.length; o++) {
                let file = pl.path + '/' + filenames[o]
                userMethods.checkMP3FileTags(file, function (err, tags) {
                  if (err) console.error(err) // TODO Handle error
                  else if (tags) {
                    let track = {}

                    tags.forEach(tag => {
                      track[tag.name] = tag.value
                    })

                    track.playlist = pl.id
                    track.path = file
                    track.file = filenames[o]

                    allTracks.push(track)
                  }

                  processedTracks++
                  if (processedTracks === filenames.length) {
                    checkNResolve()
                  }
                })
              }
            }
          })
        } else {
          checkNResolve()
        }
      }
    })
  },
  deletePlaylist (playlistName, callback) {
    playlistName = utils.encodeIntoFilename(playlistName)
    rimraf(homeFolderPath() + '/' + playlistName, function () {
      console.log('Playlist ' + playlistName + ' Deleted')
      callback()
    })
  },
  renameFolder ({oldName, newName}) {
    newName = utils.encodeIntoFilename(newName)
    oldName = utils.encodeIntoFilename(oldName)
    console.log('RENAMING FOLDER: ' + oldName + ' => ' + newName)
    let base = homeFolderPath() + '/'
    if (!fs.existsSync(base + oldName)) return
    fs.rename(base + oldName, base + newName)
  },
  checkMP3FileTags (path, fn) {
    fs.open(path, 'r', function (err, fd) {
      if (err) return fn(err, null)

      fs.fstat(fd, function (err, stats) {
        if (err) return closeFile(fd, err, null)

        let bufferSize = stats.size < 512 ? stats.size : 512
        let buffer = new Buffer.alloc(bufferSize)

        fs.read(fd, buffer, 0, bufferSize, 0, () => {
          let headerPointer = buffer.indexOf('TXXX')
          if (headerPointer === -1) return closeFile(fd, null, null)

          // let tagSize = 57*3 + 13
          let tagsBuffer = new Buffer.alloc(bufferSize - headerPointer)

          buffer.copy(tagsBuffer, 0, headerPointer)

          let fileContents = (iconv.decode(tagsBuffer, 'ISO-8859-1').replace(/\0/g, ''))
          fileContents = fileContents.substring(fileContents.indexOf('songbasket'))
          let tagPosition = fileContents.indexOf('songbasket')
          let tags = tagPosition === -1 ? null : []

          console.log(fileContents)
          for (null; tagPosition !== -1; tagPosition = fileContents.indexOf('songbasket')) {
            let tagObj = {}

            let tagEnd = fileContents.substring(tagPosition).indexOf('ÿþ')
            tagObj.name = fileContents.slice(tagPosition, tagEnd)
            fileContents = fileContents.substring(tagEnd + 2)

            let tagLength = giveMeTagLength(tagObj.name)
            tagObj.value = fileContents.substring(0, tagLength)
            fileContents = fileContents.substring(fileContents.indexOf('songbasket'))

            tags.push(tagObj)

            console.log(tagObj)
            console.log(fileContents)
          }
          console.log('\n')

          closeFile(fd, null, tags)
        })
      })
    })

    function giveMeTagLength (name) {
      switch (name) {
        case 'songbasket_spotify_id':
          return 21
        case 'songbasket_youtube_id':
          return 11
        default:
          return -1
      }
    }
    function closeFile (fd, err, tags) {
      fs.close(fd, () => {})
      fn(err, tags)
    }
  }
}

function checkPathThenCreate (path) {
  let pathExists = fs.existsSync(path)
  if (!pathExists) fs.mkdirSync(path)
  return pathExists
}

export default userMethods
