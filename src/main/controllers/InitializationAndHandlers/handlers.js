import FSControler from '../FileSystem/index'
import { logme } from '../../../UTILS'
import customGetters from '../../../renderer/store/customGetters'
import * as sbFetch from '../../sbFetch'
import GLOBAL from '../../Global/VARIABLES'
import IpcController from './ipc.controller'
import youtubeDl from '../DownloadPhase/youtube-dl'
import connectionController from './connection.controller'

const openBrowser = require('open')
const ipcSend = IpcController.send

let BROWSER_WINDOW
let SESSION
let DIALOG

export function init ({ app, BrowserWindow, session, dialog }) {
  BROWSER_WINDOW = BrowserWindow
  SESSION = session
  DIALOG = dialog
  app.on('ready', () => {
    connectionController.init({
      connectionChangeCallback: (value) => {
        ipcSend('Connection:CHANGE', value)
      }
    })
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

export function download (e, plFilter) {
  console.log('About to download')
  FSControler.UserMethods.retrieveLocalTracks()
    .then(tracks => {
      youtubeDl.downloadSyncedPlaylists(tracks, plFilter)
    })
}

export function isEverythingReady () {
  console.log(GLOBAL.FFMPEG_BINS_DOWNLOADED, GLOBAL.WINDOW_FINISHED_LOADING, GLOBAL.DOCUMENT_FINISHED_LOADING)
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
    backgroundColor: '#151515',
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  GLOBAL.MAIN_WINDOW.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)

  GLOBAL.MAIN_WINDOW.on('closed', () => GLOBAL.MAIN_WINDOW = null)
}

export async function setHomeFolder () {
  let { canceled, filePaths } = await DIALOG.showOpenDialog(GLOBAL.MAIN_WINDOW, {
    properties: ['openDirectory']
  })
  if (canceled) return
  await GLOBAL.VUEX.dispatch('addHomeFolder', filePaths[0])
  try {
    console.log('pass')
    // if songbasket exists in file specified it will load data automatically
    await retrieveAndStoreState(filePaths[0])
    console.log('from sethomefolder handler')
    pushToHome()
  } catch (err) {
    // Else ask to login and start a folder from 0
    ipcSend('continueToLogin')
  }
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
        ipcSend('playlists done')
        if (GLOBAL.LOGIN_WINDOW) GLOBAL.LOGIN_WINDOW.close()
      }
    })
}

export async function retrieveAndStoreState (path) {
  let data
  try {
    data = await FSControler.UserMethods.retrieveState(path)
    try {
      await GLOBAL.VUEX.dispatch('storeDataFromDisk', data)
      // Check if folder has synced playlists to setup watchers
      await FSControler.UserMethods.setFolderIcons()
      await FSControler.FileWatchers.createPlaylistWatchers()
    } catch (err) { throw err }
  } catch (err) { throw err }
}

export async function verifyFileSystem () {
  console.log('Checking for existing home folders')
  let FOLDERS = await FSControler.UserMethods.checkForUser()
  await GLOBAL.VUEX.dispatch('setFolderPaths', FOLDERS)
  if (FOLDERS.paths.length === 0) {
    console.log('no user')
    return setTimeout(() => {
      ipcSend('initializeSetup')
    }, 1000)
  }

  if (FOLDERS.selected === null) {
    // TODO redirect to folders view
    return ipcSend('chooseFolder')
  }

  try {
    await retrieveAndStoreState(FOLDERS.selected)
    pushToHome()
  } catch (err) {
    // TODO Handle errors when retrieving and setting data
    console.error('NOT FOOUND', err)
    return setTimeout(() => {
      ipcSend('initializeSetup')
    }, 1000)
  }
  // guestFetch(FOLDERS.user, true)
}

export function globalLoadingState () {
  return GLOBAL.VUEX.state.Events.GLOBAL_LOADING_STATE
}

let loadingCount = 0
export function LOADING (value, target) {
  if (!value) value = false
  if (value) loadingCount++
  else loadingCount--
  console.log({value: loadingCount > 0, target})
  GLOBAL.VUEX.dispatch('globalLoadingState', {value: loadingCount > 0, target})
}

export function pushToHome () {
  console.log('pushnient')
  ipcSend('dataStored')
}

export function guestFetch (query, isFirstTime) {
  console.log('loading?', globalLoadingState().value, globalLoadingState().target)
  if (globalLoadingState().value) return
  console.log('fetchin')
  LOADING(true, 'PLAYLIST_REFRESH')
  let allData = []

  let list = false // List of playlists Retrieved (just metadata)
  let synced = false // List of synced and cached Retrieved (all tracks)

  // Are there Synced playlist to check new version
  let syncedPls = customGetters.SyncedPlaylistsSp()
  let areThereSynced = syncedPls.length > 0

  // No synced playlists
  if (!areThereSynced) synced = true
  else {
    let ids = syncedPls.map(pl => {
      return {
        id: pl.id,
        snapshot_id: pl.snapshot_id
      }
    })

    fetchMultiple(ids, true)
      .then(() => {
        synced = true
        if (list && synced) storePlaylists(allData, isFirstTime)
      })
      .catch(err => {
        // TODO Properly handle error
        console.log(111111111111)
        console.error(err.Error)
      })
      .finally(LOADING)
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
    let failed = []
    for (let i = 0; i < count; i++) {
      let playlist = playlists[i]
      sbFetch.getTracks(GLOBAL.VUEX.getters.RequestParams, playlist, checkVersion)
        .then(response => {
          GLOBAL.VUEX.dispatch('playlistStoreTracks', response.playlist).then(() => {
            if (--count === 0) {
              console.log('fetch done')
              if (!(failed.length)) resolve()
              else reject(failed)
            }
          })
        })
        .catch(err => {
          failed.push(err)
          if (--count === 0) reject(failed)
        })
        .finally(() => {

        })
    }
  })
}
