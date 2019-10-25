import FileSystemUser from './FileSystem/index'
import youtubeDl from './FileSystem/youtube-dl'
import { logme } from '../UTILS'
import store from '../renderer/store'
import customGetters from '../renderer/store/customGetters'
import * as sbFetch from './sbFetch'
import * as youtubeHandler from './youtubeHandler'
import electron from 'electron'
import dotenv from 'dotenv'
// import { sync } from 'C:/Users/joaco/AppData/Local/Microsoft/TypeScript/3.6/node_modules/@types/glob'
dotenv.config()
var open = require('open')

const dialog = electron.dialog

let { app, BrowserWindow, session } = electron

let FOLDERS = FileSystemUser.checkForUser()
const ipc = electron.ipcMain

const localBackend = 'http://localhost:5000'
// const herokuBackend = 'https://songbasket-backend.herokuapp.com'
const Backend = localBackend

const filter = { // when logging in
  urls: ['http://*.localhost:5000/*']
}

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let loginWindow
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,

    minWidth: 800,
    minHeight: 500,
    useContentSize: true
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createLoginWindow () {
  if (!loginWindow) { // Prevents creating multiple loginWindows
    loginWindow = new BrowserWindow({
      width: 550,
      height: 830,
      useContentSize: true
    })

    // user logs into spotify and backend retrieves access tokens
    loginWindow.loadURL(`${Backend}/init`, { 'extraHeaders': 'pragma: no-cache\n' })

    loginWindow.on('closed', function () { loginWindow = null })
    // Then, Backend retrieves user data and sends it back with a unique SBID
    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callbackFunc) => {
      if (details.responseHeaders.SBID !== undefined) {
        let userId = details.responseHeaders.user_id[0]
        let SBID = details.responseHeaders.SBID[0]
        let success = details.responseHeaders.success[0] // if true close window and continue

        logme(SBID)
        logme(success)

        // Gets playlist list from backend and stores them in vuex
        sbFetch.fetchPlaylists({ userId: userId, logged: true, SBID: SBID, control: { offset: 0 } })
          .then((resolve) => storePlaylists(resolve, true))
      } else logme('FAILED TO AUTHORIZE')

      callbackFunc({ requestHeaders: details.requestHeaders })
    })
  }
};

function storePlaylists (resolve, redirect) {
  store.dispatch('updateUserEntities', resolve)
    .then(() => {
      if (redirect) {
        mainWindow.webContents.send('playlists done')
        if (loginWindow) loginWindow.close()
      }
    })
}

function retrieveAndStoreState (path) {
  return new Promise((resolve, reject) => {
    FileSystemUser.retrieveState(path)
      .then(data => {
        // console.log('LO HICIMOS?', data)
        store.dispatch('storeDataFromDisk', data)
          .then(() => {
            resolve()
          })
      })
      .catch(err => {
        reject(err)
      })
  })
}

function verifyFileSystem () {
  return new Promise((resolve, reject) => {
    if (FOLDERS.folders.length > 0) {
      store.dispatch('folderPaths', FOLDERS.folders)
        .then(() => {
          let comodin = true
          if (FOLDERS.folders.length === 1 || comodin) {
            store.dispatch('setHomeFolder', FOLDERS.folders[0].path)
            retrieveAndStoreState(FOLDERS.folders[0].path)
              .then(() => {
                mainWindow.webContents.send('dataStored')
              })
              .catch((err) => {
                // TODO Handle errors when retrieving and setting data
                console.log('NOT FOOUND', err)
                mainWindow.webContents.send('initializeSetup')
              })
          } else {
            // TODO redirect to folders view
          }
        })
      // guestFetch(FOLDERS.user, true)
    } else {
      console.log('no user', 1)
      mainWindow.webContents.send('initializeSetup')
    }
  })
}

app.on('ready', () => {
  createWindow()
  mainWindow.webContents.on('did-finish-load', () => {
    verifyFileSystem()
      .then(() => {
        console.log(2)
      })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function guestFetch (query, updateOrFirstTime) {
  let allData = []

  let list = false // List of playlists Retrieved (just metadata)
  let synced = false // List of synced and cached Retrieved (all tracks)

  // Are there Synced playlist to check new version
  let syncedPls = customGetters.SyncedPlaylistsSp()
  let areThereSynced = syncedPls.length > 0

  // No synced playlists
  if (!areThereSynced) synced = true
  else {
    let ids = [...syncedPls.map(pl => {
      return {
        id: pl.id,
        snapshot_id: pl.snapshot_id
      }
    })
    ]

    fetchMultiple(ids, true)
      .then(() => {
        synced = true
        if (list && synced) storePlaylists(allData, updateOrFirstTime)
      })
  }

  sbFetch.fetchPlaylists({ userId: query, logged: false, SBID: null, control: { offset: 0 } })
    .then(resolve => {
      if (resolve.code === 200) {
        allData = resolve
        list = true
        if (list && synced) storePlaylists(allData, updateOrFirstTime)
      }
    })
}

function fetchMultiple (playlists, checkVersion) {
  return new Promise((resolve, reject) => {
    let count = playlists.length
    for (let i = 0; i < count; i++) {
      let playlist = playlists[i]
      sbFetch.getTracks(store.getters.RequestParams, playlist, checkVersion)
        .then(response => {
          store.dispatch('playlistStoreTracks', response.playlist).then(() => {
            count--
            if (count === 0) resolve()
          })
        })
    }
  })
}
console.log('Home folder: ', process.env.HOME_FOLDER)
// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::
ipc.on('download', function (event, id) {
  // console.log('openYtVideo', id)
  FileSystemUser.checkDownloadPaths()
    .then(playlists => {
      youtubeDl.downloadSyncedPlaylists(playlists)
    })
})

ipc.on('openYtVideo', function (event, id) {
  // console.log('openYtVideo', id)
  open('https://www.youtube.com/watch?v=' + id)
})

ipc.on('setHomeFolder', function (event) {
  // console.log('goty')
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, path => {
    if (path === undefined) return
    store.dispatch('setHomeFolder', path[0])
      .then(() => mainWindow.webContents.send('continueToLogin'))
  })
})

ipc.on('login', function (event) {
  createLoginWindow()
})

ipc.on('guestSignIn', function (event, {mode, query}) {
  console.log('Guest:: Type:', mode, query)

  if (mode === 'user') {
    if (query !== null && query !== undefined) {
      sbFetch.guestLogin(query)
        .then(resolve => {
          if (resolve.code === 404) {
            mainWindow.webContents.send('not-found')
          }
          if (resolve.code === 400) {
            mainWindow.webContents.send('invalid')
          }
          if (resolve.code === 200) {
            mainWindow.webContents.send('user-found', resolve)
          }
        })
        .catch(err => logme(err))
    }
  }
  if (mode === 'playlist') {
    // TODO make dis
    sbFetch.getTracks(store.getters.RequestParams, {id: query}, false)
      .then(response => {
        console.log('responseta', response)
        if (response.error) {
          console.log('ERROR DUD', response)
        } else {
          console.log('DOUU', response)
        }
        // store.dispatch('playlistStoreTracks', response.playlist).then(() => {
        //   count--
        //   if (count === 0) resolve()
        // })
      })
      .catch(error => {
        console.log('a ver si lo aachea', error)
      })
  }
})

ipc.on('guestConfirm', function (event, userID) {
  logme(`Fetching Playlists from Guest user ${userID}`)
  // Saving Home folder to .songbasket-userdata
  let addNewFolder = FileSystemUser.addHomeFolder(store.state.SharedStates.fileSystem.homeFolders[0])
  if (addNewFolder === 'already added') {
    // handle already added folder (Tell user)
  }
  guestFetch(userID, true)
})

ipc.on('refreshPlaylists', function (event) {
  console.log('Refreshing Playlists')
  guestFetch(store.getters.RequestParams.userId, false)
})

ipc.on('loadMore', function (event) {
  logme('LOADING MORE PLAYLISTS:::::::::')

  // gets user_id, SBID and Control object
  sbFetch.fetchPlaylists(store.getters.RequestParams)
    .then(resolve => {
      store.dispatch('updatePlaylists', resolve.playlists).then(() => {
        mainWindow.webContents.send('done loading')
      })
    })
})

ipc.on('get tracks from', function (event, id) {
  if (store.getters.PlaylistIsCached(id) === false && store.getters.PlaylistIsSynced(id) === false) {
    console.log('LOADING FROM ', id)
    fetchMultiple([{id}], false)
      .then(() => {
        mainWindow.webContents.send('open playlist', id)
      })
  } else mainWindow.webContents.send('open playlist', id)
})

ipc.on('Youtube Convert', function () {
  console.log(store.state.CurrentUser.queuedPlaylists, store.state.CurrentUser.syncedPlaylists)
  if (store.state.CurrentUser.queuedPlaylists.length + store.state.CurrentUser.syncedPlaylists.length === 0) return

  console.log('FETCHING YT')
  let unCached = store.getters.UnCachedPlaylists
  console.log('unCached', unCached)
  if (unCached.length > 0) {
    fetchMultiple(unCached.map(pl => {
      return { id: pl }
    }), false)
      .then(() => youtubeHandler.youtubizeAll())
  } else youtubeHandler.youtubizeAll()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
