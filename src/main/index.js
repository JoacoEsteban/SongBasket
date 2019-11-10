import dotenvConfig from './dotenvConfig'
import FileSystemUser from './FileSystem/index'
import youtubeDl from './FileSystem/youtube-dl'
import { logme } from '../UTILS'
import store from '../renderer/store'
import customGetters from '../renderer/store/customGetters'
import * as sbFetch from './sbFetch'
import * as youtubeHandler from './youtubeHandler'
import electron from 'electron'
console.log(dotenvConfig) // logging for linter not to complain
var open = require('open')

const dialog = electron.dialog

let { app, BrowserWindow, session } = electron

let FOLDERS = FileSystemUser.checkForUser()
const ipc = electron.ipcMain

const Backend = process.env.BACKEND

const filter = { // when logging in
  urls: [Backend + '/*']
}

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let loginWindow
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

let ffmpegBinsDownloaded = false
let windowFinishedLoading = false

function isEverythingReady () {
  if (ffmpegBinsDownloaded && windowFinishedLoading) verifyFileSystem()
}

function createWindow () {
  let width = 1366
  let height = 768
  mainWindow = new BrowserWindow({
    width,
    height,

    minWidth: width,
    minHeight: height,
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

function storePlaylists (response, redirect) {
  store.dispatch('updateUserEntities', response)
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
                setTimeout(() => {
                  mainWindow.webContents.send('dataStored')
                }, 2000)
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
      console.log('no user')
      setTimeout(() => {
        mainWindow.webContents.send('initializeSetup')
      }, 1000)
    }
  })
}

function globalLoadingState () {
  return store.state.Events.GLOBAL_LOADING_STATE
}

function LOADING (value, target) {
  if (!value) value = false
  store.dispatch('globalLoadingState', {value, target})
}

app.on('ready', () => {
  createWindow()
  mainWindow.webContents.on('did-finish-load', () => {
    windowFinishedLoading = true
    isEverythingReady()
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

function guestFetch (query, isFirstTime) {
  console.log(globalLoadingState().value)
  if (globalLoadingState().value) return
  console.log('fetchin')
  store.dispatch('globalLoadingState', {value: true, target: 'PLAYLIST_REFRESH'})
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
        if (list && synced) storePlaylists(allData, isFirstTime)
      })
      .catch(err => {
        // TODO Properly handle error
        console.error(err)
      })
  }

  sbFetch.fetchPlaylists({ userId: query, logged: false, SBID: null, control: { offset: 0 } })
    .then(resolve => {
      if (resolve.code === 200) {
        allData = resolve
        list = true
        if (list && synced) storePlaylists(allData, isFirstTime)
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
ipc.on('ffmpegBinsDownloaded', function () {
  ffmpegBinsDownloaded = true
  isEverythingReady()
})

ipc.on('ytTrackDetails', function (event, ytId) {
  if (globalLoadingState().value) return
  LOADING(true, 'ytDetails')
  sbFetch.ytDetails(ytId)
    .then(resp => {
      console.log('YT Details retrieved', resp)
      event.sender.send('done', resp)
    })
    .catch(err => {
      console.error('EROR AT YTTRACKDETAILS:: ipc"ytTrackDetails"', err)
      event.sender.send('error')
    })
    .finally(() => {
      LOADING()
    })
})

ipc.on('download', function (event) {
  console.log('About to download')
  FileSystemUser.checkDownloadPaths()
    .then(playlists => {
      console.log('passed')
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
  guestFetch(store.getters.RequestParams.userId, false)
})

ipc.on('loadMore', function (event) {
  if (globalLoadingState().value) return
  logme('LOADING MORE PLAYLISTS:::::::::')
  LOADING(true, 'morePlaylists')
  // gets user_id, SBID and Control object
  sbFetch.fetchPlaylists(store.getters.RequestParams)
    .then(resolve => {
      store.dispatch('updatePlaylists', resolve.playlists).then(() => {
        mainWindow.webContents.send('done loading')
      })
    })
    .catch(err => {
      console.error(err) // TODO Handle error
    })
    .finally(LOADING)
})

ipc.on('get tracks from', function (event, id) {
  if (globalLoadingState().value) return
  if (store.getters.PlaylistIsCached(id) === false && store.getters.PlaylistIsSynced(id) === false) {
    LOADING(true, 'playlistTracks')
    console.log('LOADING FROM ', id)
    fetchMultiple([{id}], false)
      .then(() => {
        mainWindow.webContents.send('open playlist', id)
      })
      .catch(err => {
        console.error(err) // TODO Handle error
      })
      .finally(LOADING)
  } else mainWindow.webContents.send('open playlist', id)
})

ipc.on('Youtube Convert', function () {
  if (globalLoadingState().value) return
  if (store.state.CurrentUser.queuedPlaylists.length + store.state.CurrentUser.syncedPlaylists.length === 0) return

  console.log('FETCHING YT')
  let unCached = store.getters.UnCachedPlaylists
  console.log('unCached', unCached)
  if (unCached.length > 0) {
    LOADING(true, 'fetchPlaylists')
    fetchMultiple(unCached.map(pl => {
      return { id: pl }
    }), false)
      .then(() => {
        LOADING()
        youtubeHandler.youtubizeAll()
      })
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
