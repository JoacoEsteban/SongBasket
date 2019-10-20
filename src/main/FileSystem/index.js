import customGetters from '../../renderer/store/customGetters'
const electron = require('electron')
var fs = require('fs')
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
        playlists = [...playlists, { id: pl.id, path: process.env.HOME_FOLDER + '/' + pl.name, tracks: [] }]
      }
      console.log('playlists', playlists)

      for (let i = 0; i < playlists.length; i++) {
        let pl = playlists[i]
        let path = pl.path
        checkPathThenCreate(path)
        fs.readdir(path, function (err, filenames) {
          if (err) {
            console.error('error reading path', path)
            reject(err)
            return
          }
          filenames = filenames.filter(n => n.substr(n.length - 3) === 'mp3')
          // filenames = filenames.map(n => n.substr(0, n.length - 4))
          console.log('path: ', path, filenames)

          // TODO Implement Spotify ID Tag into MP3 file and verify existing songs
          pl.tracks = []
        })
      }
      resolve(playlists)
    })
  }
}

function checkPathThenCreate (path) {
  if (!fs.existsSync(path)) fs.mkdirSync(path)
}

export default userMethods
