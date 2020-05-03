import FSController from '../FileSystem/index'
// import customGetters from '../Store/Helpers/customGetters'
import * as sbFetch from './sbFetch'

import IpcController from './ipc.controller'
import youtubeDl from '../DownloadPhase/youtube-dl'
import connectionController from './connection.controller'
import VUEX_MAIN from '../Store/mainProcessStore'
import { v4 as uuid } from 'uuid'

import core from './core.controller'

const openBrowser = require('open')
const ipcSend = IpcController.send
const ipcOnce = IpcController.once

let BROWSER_WINDOW
let SESSION
let DIALOG

export const load = {
  target: [],
  count: 0,
  // -----------------------
  set (target, value) {
    this.count += value

    if (value > 0) this.target.push(target)
    else this.target.splice(this.target.indexOf(target), 1)

    this.reflect({value: this.isLoading, target})
    return this.isLoading
  },
  reflect (payload = this.instance) {
    console.log('current', this.instance)
    ipcSend('LOADING_EVENT', payload)
  },
  // -----------------------
  get instance () {
    return {value: this.isLoading, target: this.which}
  },
  get isLoading () {
    return this.count > 0
  },
  get which () {
    return this.target.last
  },
  get canRequest () {
    return !this.isLoading && global.CONNECTED_TO_INTERNET
  },
  // -----------------------
  get on () {
    return this.fn(1)
  },
  get off () {
    return this.fn(-1)
  },
  ptg (target, ptg) {
    this.reflect({target: target, value: this.isLoading, ptg})
  },
  fn (val) {
    return function (target) {
      return this.set(target, val)
    }
  }
}

export function normalizeError (error) {
  if (error && error.response) return {status: error.response.status, data: error.response.data}
  return error
}

export function REFLECT_RENDERER () {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    ipcOnce(listenerId, resolve)
    ipcSend('VUEX:STORE', {state: VUEX_MAIN.STATE_SAFE(), listenerId})
  })
}
export function REFLECT_RENDERER_KEY (key) {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    ipcOnce(listenerId, resolve)
    const value = VUEX_MAIN.STATE_SAFE(key)[key]
    ipcSend('VUEX:SET', {key, value, listenerId})
  })
}
export function SEND_ERROR ({type, error}) {
  return new Promise((resolve, reject) => {
    ipcSend('ERROR:CATCH', {type, error: normalizeError(error)})
  })
}

export function init ({ app, BrowserWindow, session, dialog }) {
  global.CONSTANTS.BROWSER_WINDOW = BROWSER_WINDOW = BrowserWindow
  global.CONSTANTS.SESSION = SESSION = session
  global.CONSTANTS.DIALOG = DIALOG = dialog
  app.on('ready', () => {
    connectionController.init({
      connectionChangeCallback: (value) => {
        ipcSend('Connection:CHANGE', value)
      },
      apiConnectionChangeCallback: (value) => {
        ipcSend('ApiConnection:CHANGE', value)
      }
    })
    createWindow()
    global.CONSTANTS.MAIN_WINDOW.webContents.on('did-finish-load', () => {
      console.log('webcontents')
      global.CONSTANTS.WINDOW_FINISHED_LOADING = true
      isEverythingReady()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (global.CONSTANTS.MAIN_WINDOW === null) {
      createWindow()
    }
  })
}

export const rendererMethods = {
  documentReadyCallback: () => {
    global.CONSTANTS.DOCUMENT_FINISHED_LOADING = true
    isEverythingReady()
  }
}

export function openYtVideo (event, id) {
  openBrowser('https://www.youtube.com/watch?v=' + id)
}

export function isEverythingReady () {
  console.log(global.CONSTANTS.FFMPEG_BINS_DOWNLOADED, global.CONSTANTS.WINDOW_FINISHED_LOADING, global.CONSTANTS.DOCUMENT_FINISHED_LOADING)
  global.CONSTANTS.FFMPEG_BINS_DOWNLOADED && global.CONSTANTS.WINDOW_FINISHED_LOADING && global.CONSTANTS.DOCUMENT_FINISHED_LOADING && verifyFileSystem()
}

export function createWindow () {
  global.CONSTANTS.MAIN_WINDOW = new BROWSER_WINDOW(global.CONSTANTS.MAIN_WINDOW_CONFIG)
  global.CONSTANTS.MAIN_WINDOW.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)
  global.CONSTANTS.MAIN_WINDOW.on('closed', () => global.CONSTANTS.MAIN_WINDOW = null)
}

export async function setHomeFolder () {
  const { canceled, filePaths } = await DIALOG.showOpenDialog(global.CONSTANTS.MAIN_WINDOW, {
    properties: ['openDirectory']
  })
  if (canceled) return
  try {
    await FSController.UserMethods.addFolder(filePaths[0])
    // if songbasket exists in file specified it will load data automatically
    await retrieveAndStoreState(global.HOME_FOLDER)
    pushToHome()
  } catch (err) {
    // Else ask to login and start a folder from 0
    ipcSend('continueToLogin')
  }
}

export function createLoginWindow () {
  if (global.CONSTANTS.LOGIN_WINDOW) return

  const loginWindow = global.CONSTANTS.LOGIN_WINDOW = new BROWSER_WINDOW(global.CONSTANTS.POPUP_WINDOW_CONFIG)

  loginWindow.loadURL(`${global.CONSTANTS.BACKEND}/init`, { 'extraHeaders': 'pragma: no-cache\n' })
  loginWindow.on('closed', () => global.CONSTANTS.LOGIN_WINDOW = null)
  SESSION.defaultSession.webRequest.onHeadersReceived({urls: [global.CONSTANTS.BACKEND + '/*']}, async (details, cb) => {
    await core.onLogin(details, cb)
    REFLECT_RENDERER()
  })
}

export async function retrieveAndStoreState (path = global.HOME_FOLDER) {
  let data
  try {
    data = await FSController.UserMethods.retrieveState(path)
    try {
      VUEX_MAIN.COMMIT.STORE_DATA_FROM_DISK(data)
      REFLECT_RENDERER()
      // Check if folder has synced playlists to setup watchers
      await FSController.UserMethods.setFolderIcons()
      await FSController.FileWatchers.createPlaylistWatchers()
    } catch (err) { throw err }
  } catch (err) { throw err }
}

export async function verifyFileSystem () {
  console.log('Checking for existing home folders')
  let FOLDERS = await FSController.UserMethods.retrieveFolders()
  if (!FOLDERS.paths.length) {
    console.log('no user')
    return setTimeout(() => {
      ipcSend('initializeSetup')
    }, 1000)
  }

  if (!FOLDERS.selected) {
    // TODO redirect to folders view
    return ipcSend('chooseFolder')
  }

  try {
    await retrieveAndStoreState()
    await core.setSongbasketIdGlobally()
    pushToHome()
  } catch (err) {
    // TODO Handle errors when retrieving and setting data
    console.error('NOT FOOUND', FOLDERS, err)
    return setTimeout(() => {
      ipcSend('initializeSetup')
    }, 1000)
  }
  // guestFetch(FOLDERS.user, true)
}

export function pushToHome () {
  console.log('pushnient')
  ipcSend('dataStored')
}

// ------- revision v2 -------
export async function refresh () {
  try {
    let completed = 0
    if (!load.canRequest) return
    load.on('PLAYLISTS:REFRESH')
    await core.updateAll({
      playlistCompletionCallback: (err, pl, playlists) => {
        if (err) {
        }
        load.ptg('PLAYLISTS:REFRESH', (++completed / playlists.length))
      }
    })
  } catch (error) {
    SEND_ERROR({type: 'PLAYLISTS:REFRESH', error})
  } finally {
    console.log('before loadoff')
    load.off('PLAYLISTS:REFRESH')
    await REFLECT_RENDERER()
  }
}

// if (handlers.globalLoadingStateDEPRECATED().value) return console.log('loading', handlers.globalLoadingStateDEPRECATED())
export async function youtubize () {
  try {
    let completed = 0
    if (!load.canRequest) return
    load.on('YOUTUBIZE')
    await core.youtubize({
      trackCompletionCallback: total => {
        load.ptg('YOUTUBIZE', (++completed / total))
      }
    })
  } catch (error) {
    SEND_ERROR({type: 'YOUTUBIZE', error})
    throw error
  } finally {
    load.off('YOUTUBIZE')
    await REFLECT_RENDERER()
  }
}

export async function download (e, plFilter) {
  console.log('About to download')
  try {
    load.on('DOWNLOAD')
    const tracks = await FSController.UserMethods.retrieveLocalTracks()
    await youtubeDl.downloadSyncedPlaylists(tracks, plFilter)
    load.off('DOWNLOAD')
  } catch (error) {
    throw error
  }
}

export function queuePlaylist (id) {
  VUEX_MAIN.COMMIT.QUEUE_PLAYLIST(id)
  REFLECT_RENDERER_KEY('queuedPlaylists')
}

export async function unsyncPlaylist (id) {
  try {
    if (load.isLoading) return
    load.on('PLAYLIST:UNSYNC')
    await VUEX_MAIN.COMMIT.UNSYNC_PLAYLIST(id)
  } catch (error) {
    console.error('Error unsyncing @ handlers.unsyncPlaylist', error)
    SEND_ERROR({type: 'PLAYLIST:UNSYNC', error})
    throw error
  } finally {
    load.off('PLAYLIST:UNSYNC')
    await REFLECT_RENDERER()
  }
}

export async function changeYtTrackSelection ({trackId, newId}) {
  try {
    if (load.isLoading) return
    VUEX_MAIN.COMMIT.CHANGE_YT_TRACK_SELECTION({trackId, newId})
  } catch (err) {
    console.error('Error changing track selection', err)
    throw err
  } finally {
    await REFLECT_RENDERER_KEY('convertedTracks')
  }
}

export async function getYtTrackDetails (event, {url, trackId, listenerId}) {
  if (!load.canRequest) return
  try {
    const details = await sbFetch.ytDetails(url)
    console.log('YT Details retrieved', details)
    VUEX_MAIN.COMMIT.CUSTOM_TRACK_URL({details, trackId})
    await REFLECT_RENDERER_KEY('convertedTracks')
    event.sender.send(listenerId)
  } catch (err) {
    console.error('EROR AT YTTRACKDETAILS:: ipc"ytTrackDetails"', err)
    event.sender.send(listenerId + ':ERROR')
  }
}
