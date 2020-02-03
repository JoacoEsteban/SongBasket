import dotenvConfig from './dotenvConfig'
import FileSystemUser from './FileSystem/index'
import youtubeDl from './FileSystem/youtube-dl'
import { logme } from '../UTILS'
import store from '../renderer/store'
import customGetters from '../renderer/store/customGetters'
import * as sbFetch from './sbFetch'
import * as youtubeHandler from './youtubeHandler'
import electron from 'electron'
import log from 'electron-log'

let a = true
if (process.env.NODE_ENV === 'production' || a) {
  process.on('uncaughtException', function (error) {
    log.warn(error)
  })
}

console.log(dotenvConfig) // logging for linter not to complain
const open = require('open')
const ipc = electron.ipcMain
const dialog = electron.dialog
const { app, BrowserWindow, session } = electron
const Backend = process.env.BACKEND
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
const filter = { // when logging in
  urls: [Backend + '/*']
}

let mainWindow
let loginWindow

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// TODO just prevent starting downloads without ffmpeg, dont block Application bootup
// let ffmpegBinsDownloaded = false
let ffmpegBinsDownloaded = true
let windowFinishedLoading = false
let homePushed = false

function isEverythingReady () {
  if (ffmpegBinsDownloaded && windowFinishedLoading) verifyFileSystem()
}

function createWindow () {
  let width = 1000
  let height = 500
  mainWindow = new BrowserWindow({
    width,
    height,
    frame: false,
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
      frame: false,
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

async function retrieveAndStoreState (path) {
  let data
  try {
    data = await FileSystemUser.retrieveState(path)
    try {
      await store.dispatch('storeDataFromDisk', data)
    } catch (err) { throw err }
  } catch (err) { throw err }
}

async function verifyFileSystem () {
  console.log('Checking for existing home folders')
  let FOLDERS = FileSystemUser.checkForUser()
  await store.dispatch('setFolderPaths', FOLDERS)
  if (FOLDERS.paths.length === 0) {
    console.log('no user')
    return setTimeout(() => {
      mainWindow.webContents.send('initializeSetup')
    }, 1000)
  }

  if (FOLDERS.selected === null) {
    // TODO redirect to folders view
    return mainWindow.webContents.send('chooseFolder')
  }

  try {
    await retrieveAndStoreState(FOLDERS.selected)
    pushToHome()
  } catch (err) {
    // TODO Handle errors when retrieving and setting data
    console.error('NOT FOOUND', err)
    return setTimeout(() => {
      mainWindow.webContents.send('initializeSetup')
    }, 1000)
  }
  // guestFetch(FOLDERS.user, true)
}

function globalLoadingState () {
  return store.state.Events.GLOBAL_LOADING_STATE
}

function LOADING (value, target) {
  if (!value) value = false
  store.dispatch('globalLoadingState', {value, target})
}

function pushToHome () {
  mainWindow.webContents.send('dataStored')
  if (!homePushed) setTimeout(pushToHome, 200)
}

app.on('ready', () => {
  createWindow()
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('webcontents')
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
  console.log('loading?', globalLoadingState().value)
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
      if (resolve.status === 200) {
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
        .catch(err => {
          reject(err)
        })
    }
  })
}
console.log('Home folder: ', global.HOME_FOLDER)
// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::
ipc.on('ffmpegBinsDownloaded', function () {
  console.log('ffmpeg')

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
  open('https://www.youtube.com/watch?v=' + id)
})

ipc.on('setHomeFolder', async function () {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, async path => {
    if (path === undefined) return
    await store.dispatch('addHomeFolder', path[0])
    try {
      console.log('pass')
      // if songbasket exists in file specified it will load data automatically
      await retrieveAndStoreState(path[0])
      pushToHome()
    } catch (err) {
      // Else ask to login and start a folder from 0
      mainWindow.webContents.send('continueToLogin')
    }
  })
})

ipc.on('login', function () {
  createLoginWindow()
})

ipc.on('homePushed', function () {
  homePushed = true
})

ipc.on('guestSignIn', function (event, {mode, query}) {
  console.log('Guest:: Type:', mode, query)

  if (mode === 'user') {
    if (query !== null && query !== undefined) {
      sbFetch.guestLogin(query)
        .then(resolve => {
          if (resolve.status === 404) {
            mainWindow.webContents.send('not-found')
          }
          if (resolve.status === 400) {
            mainWindow.webContents.send('invalid')
          }
          if (resolve.status === 200) {
            mainWindow.webContents.send('user-found', resolve)
          }
        })
        .catch(err => logme(err))
    }
  }
  if (mode === 'playlist') {
    // TODO delete this
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

ipc.on('guestConfirm', async function (event, userID) {
  // Saving Home folder to .songbasket-userdata
  try {
    logme(`Fetching Playlists from Guest user ${userID}`)
    guestFetch(userID, true)
  } catch (err) { throw err }
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
      .catch(err => {
        console.error('ERROR AT YoutubeConvert:: fetchMultiple', err)
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
