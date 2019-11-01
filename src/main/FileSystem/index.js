import customGetters from '../../renderer/store/customGetters'
import * as utils from '../../MAIN_PROCESS_UTILS'
const electron = require('electron')
var fs = require('fs')
var rimraf = require('rimraf')
let NodeID3 = require('node-id3')

const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/'
const foldersJsonPath = userDataPath + '.songbasket-folders'
const stateFileName = '/.songbasket'
console.log(foldersJsonPath)

let homeFolderPath = () => process.env.HOME_FOLDER

let userMethods = {
  checkForUser: function () {
    let folders = fs.existsSync(foldersJsonPath)

    if (folders) {
      folders = fs.readFileSync(foldersJsonPath, 'utf8')
      return JSON.parse(folders)
    } else {
      console.log('Folder paths file missing, Creating')
      let emptyFolders = {folders: []}
      fs.writeFileSync(foldersJsonPath, JSON.stringify(emptyFolders), 'utf8')
      return (emptyFolders)
    }
  },
  addHomeFolder: function (path) {
    let paths = JSON.parse(fs.readFileSync(foldersJsonPath))
    console.log('paths', paths)
    path = path.path

    for (let i = 0; i < paths.folders.length; i++) {
      paths.folders[i].current = false
      if (paths.folders[i] === path) return 'already added'
    }

    paths.folders = [...paths.folders, {path, current: true}]
    fs.writeFileSync(foldersJsonPath, JSON.stringify(paths))
    return 'success'
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
    console.log('retrieving from ', path)
    return new Promise((resolve, reject) => {
      fs.access(path + stateFileName, (err) => {
        if (err) reject(err)
        else {
          fs.readFile(path + stateFileName, (err, data) => {
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
                NodeID3.read(file, function (err, tags) {
                  if (err) console.error(err) // TODO Handle error
                  tags = tags.userDefinedText
                  if (tags) {
                    let track = {}
                    let found = 2 // 2 tags to find
                    for (let u = 0; u < tags.length; u++) {
                      let tag = tags[u]
                      let expression = /(songbasket|SONGBASKET)_(youtube|YOUTUBE|spotify|SPOTIFY)_(id|ID)/
                      if (expression.test(tag.description)) {
                        track[tag.description.toLowerCase()] = tag.value
                        if (--found === 0) { // all tags found
                          track.playlist = pl.id
                          track.path = file
                          track.file = filenames[o]
                          allTracks.push(track)
                          break
                        }
                      }
                    }
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
  }
}

function checkPathThenCreate (path) {
  let pathExists = fs.existsSync(path)
  if (!pathExists) fs.mkdirSync(path)
  return pathExists
}

export default userMethods
