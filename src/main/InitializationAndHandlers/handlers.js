import FileSystemUser from '../FileSystem/index'
// import youtubeDl from './FileSystem/youtube-dl'
import { logme } from '../../UTILS'
import customGetters from '../../renderer/store/customGetters'
import * as sbFetch from '../sbFetch'
import GLOBAL from '../Global/VARIABLES'
import youtubeDl from '../FileSystem/youtube-dl'
// import * as youtubeHandler from './youtubeHandler'
const openBrowser = require('open')
let BROWSER_WINDOW
let SESSION
let DIALOG

export function init ({ app, BrowserWindow, session, dialog }) {
  BROWSER_WINDOW = BrowserWindow
  SESSION = session
  DIALOG = dialog
  app.on('ready', () => {
    createWindow()
    GLOBAL.MAIN_WINDOW.webContents.on('did-finish-load', () => {
      console.log('webcontents')
      GLOBAL.WINDOW_FINISHED_LOADING = true
      isEverythingReady()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (GLOBAL.MAIN_WINDOW === null) {
      createWindow()
    }
  })
}

export const rendererMethods = {
  documentReadyCallback: () => {
    GLOBAL.DOCUMENT_FINISHED_LOADING = true
    isEverythingReady()
  }
}

export function getYtTrackDetails (event, ytId) {
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
}

export function openInBrowser (event, id) {
  openBrowser('https://www.youtube.com/watch?v=' + id)
}

export function download () {
  console.log('About to download')
  FileSystemUser.checkDownloadPaths()
    .then(playlists => {
      console.log('passed')
      youtubeDl.downloadSyncedPlaylists(playlists)
    })
}

export function isEverythingReady () {
  GLOBAL.FFMPEG_BINS_DOWNLOADED && GLOBAL.WINDOW_FINISHED_LOADING && GLOBAL.DOCUMENT_FINISHED_LOADING && verifyFileSystem()
}

export function createWindow () {
  let width = 1000
  let height = 500
  GLOBAL.MAIN_WINDOW = new BROWSER_WINDOW({
    width,
    height,
    frame: false,
    minWidth: width,
    minHeight: height,
    backgroundColor: '#333',
    useContentSize: true
  })

  GLOBAL.MAIN_WINDOW.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)

  GLOBAL.MAIN_WINDOW.on('closed', () => {
    GLOBAL.MAIN_WINDOW = null
  })
}

export async function setHomeFolder () {
  DIALOG.showOpenDialog(GLOBAL.MAIN_WINDOW, {
    properties: ['openDirectory']
  }, async path => {
    if (path === undefined) return
    await GLOBAL.VUEX.dispatch('addHomeFolder', path[0])
    try {
      console.log('pass')
      // if songbasket exists in file specified it will load data automatically
      await retrieveAndStoreState(path[0])
      pushToHome()
    } catch (err) {
      // Else ask to login and start a folder from 0
      GLOBAL.MAIN_WINDOW.webContents.send('continueToLogin')
    }
  })
}

export function createLoginWindow () {
  if (!GLOBAL.LOGIN_WINDOW) { // Prevents creating multiple GLOBAL.LOGIN_WINDOWS
    GLOBAL.LOGIN_WINDOW = new BROWSER_WINDOW({
      frame: false,
      width: 550,
      height: 830,
      useContentSize: true
    })

    // user logs into spotify and backend retrieves access tokens
    GLOBAL.LOGIN_WINDOW.loadURL(`${GLOBAL.BACKEND}/init`, { 'extraHeaders': 'pragma: no-cache\n' })

    GLOBAL.LOGIN_WINDOW.on('closed', function () { GLOBAL.LOGIN_WINDOW = null })
    // Then, Backend retrieves user data and sends it back with a unique SBID
    SESSION.defaultSession.webRequest.onHeadersReceived({urls: [GLOBAL.BACKEND + '/*']}, (details, callbackFunc) => {
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

export function storePlaylists (response, redirect) {
  GLOBAL.VUEX.dispatch('updateUserEntities', response)
    .then(() => {
      if (redirect) {
        GLOBAL.MAIN_WINDOW.webContents.send('playlists done')
        if (GLOBAL.LOGIN_WINDOW) GLOBAL.LOGIN_WINDOW.close()
      }
    })
}

export async function retrieveAndStoreState (path) {
  let data
  try {
    data = await FileSystemUser.retrieveState(path)
    try {
      await GLOBAL.VUEX.dispatch('storeDataFromDisk', data)
    } catch (err) { throw err }
  } catch (err) { throw err }
}

export async function verifyFileSystem () {
  console.log('Checking for existing home folders')
  let FOLDERS = FileSystemUser.checkForUser()
  await GLOBAL.VUEX.dispatch('setFolderPaths', FOLDERS)
  if (FOLDERS.paths.length === 0) {
    console.log('no user')
    return setTimeout(() => {
      GLOBAL.MAIN_WINDOW.webContents.send('initializeSetup')
    }, 1000)
  }

  if (FOLDERS.selected === null) {
    // TODO redirect to folders view
    return GLOBAL.MAIN_WINDOW.webContents.send('chooseFolder')
  }

  try {
    await retrieveAndStoreState(FOLDERS.selected)
    pushToHome()
  } catch (err) {
    // TODO Handle errors when retrieving and setting data
    console.error('NOT FOOUND', err)
    return setTimeout(() => {
      GLOBAL.MAIN_WINDOW.webContents.send('initializeSetup')
    }, 1000)
  }
  // guestFetch(FOLDERS.user, true)
}

export function globalLoadingState () {
  return GLOBAL.VUEX.state.Events.GLOBAL_LOADING_STATE
}

export function LOADING (value, target) {
  if (!value) value = false
  GLOBAL.VUEX.dispatch('globalLoadingState', {value, target})
}

export function pushToHome () {
  console.log('pushnient')
  GLOBAL.MAIN_WINDOW.webContents.send('dataStored')
}

export function guestFetch (query, isFirstTime) {
  console.log('loading?', globalLoadingState().value)
  if (globalLoadingState().value) return
  console.log('fetchin')
  GLOBAL.VUEX.dispatch('globalLoadingState', {value: true, target: 'PLAYLIST_REFRESH'})
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
        console.log(111111111111)
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
    .catch(error => {
      // TODO handle error
      console.error(error)
    })
}

export function fetchMultiple (playlists, checkVersion) {
  return new Promise((resolve, reject) => {
    let count = playlists.length
    let failed = false
    for (let i = 0; i < count; i++) {
      let playlist = playlists[i]
      sbFetch.getTracks(GLOBAL.VUEX.getters.RequestParams, playlist, checkVersion)
        .then(response => {
          GLOBAL.VUEX.dispatch('playlistStoreTracks', response.playlist).then(() => {
            if (--count === 0) {
              if (!(failed)) resolve()
              else reject(failed)
            }
          })
        })
        .catch(err => {
          failed = err
          if (--count === 0) reject(err)
        })
        .finally(() => {

        })
    }
  })
}
