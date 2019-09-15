const electron = require('electron')
var fs = require('fs')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/'
const foldersJsonPath = userDataPath + '.songbasket-folders'
const stateFileName = '/.songbasket'

let userMethods = {
  checkForUser: function () {
    let folders = fs.existsSync(foldersJsonPath)
    console.log('EXISTS??', folders, foldersJsonPath)

    if (folders) {
      folders = fs.readFileSync(foldersJsonPath, 'utf8')
      console.log('EXISTS', folders)
      return JSON.parse(folders)
    } else {
      console.log('Folder missing, Creating')
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
      paths[i].current = false
      if (paths.folders[i] === path) return 'already added'
    }

    paths.folders = [...paths.folders, {path, current: true}]
    fs.writeFileSync(foldersJsonPath, JSON.stringify(paths))
    return 'success'
  },
  saveState: function ({state, path}) {
    console.log('Saving state to', path)
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
      fs.readFile(path + stateFileName, (err, data) => {
        if (err) reject(err)
        resolve(JSON.parse(data))
      })
    })
  }
}

export default userMethods
