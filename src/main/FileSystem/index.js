import customGetters from '../../renderer/store/customGetters'
const electron = require('electron')
var fs = require('fs')
let NodeID3 = require('node-id3')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/'
const foldersJsonPath = userDataPath + '.songbasket-folders'
const stateFileName = '/.songbasket'

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
      let playlists = []
      for (let i = 0; i < syncedPlaylists.length; i++) {
        let pl = syncedPlaylists[i]
        playlists = [...playlists, { id: pl.id, path: process.env.HOME_FOLDER + '/' + pl.name, tracks: [], name: pl.name }]
      }
      console.log('playlists', playlists)

      let processedPls = 0
      for (let i = 0; i < playlists.length; i++) {
        let pl = playlists[i]
        let path = pl.path
        if (checkPathThenCreate(path)) {
          // Get all files from playlist dir
          fs.readdir(path, function (err, filenames) {
            if (err) {
              console.error('error reading path', path)
              reject(err)
              return
            }
            // filter to just MP3 files
            // TODO Support FLAC, etc
            filenames = filenames.filter(n => n.substr(n.length - 3) === 'mp3')
            let processedTracks = 0
            // cycle throug tracks and store SB ones
            for (let o = 0; o < filenames.length; o++) {
              let file = pl.path + '/' + filenames[o]
              NodeID3.read(file, function (err, tags) {
                if (err) console.error(err) // TODO Handle error
                tags = tags.userDefinedText
                if (tags) {
                  let track = {}
                  let found = false
                  for (let u = 0; u < tags.length; u++) {
                    let tag = tags[u]
                    let expression = /(songbasket|SONGBASKET)_(youtube|spotify)_(id|ID)/
                    if (expression.test(tag.description)) {
                      found = true
                      track[tag.description.toLowerCase()] = tag.value
                      track.path = file
                    }
                  }

                  if (found) pl.tracks.push(track)
                }

                processedTracks++
                if (processedTracks === filenames.length) {
                  processedPls++
                  if (processedPls === playlists.length) resolve(playlists)
                }
              })
            }
          })
        } else {
          processedPls++
          if (processedPls === playlists.length) resolve(playlists)
        }
      }
    })
  }
}

function checkPathThenCreate (path) {
  let pathExists = fs.existsSync(path)
  if (!pathExists) fs.mkdirSync(path)
  return pathExists
}

export default userMethods
