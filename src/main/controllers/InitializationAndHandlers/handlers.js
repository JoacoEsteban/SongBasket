import FSController from '../FileSystem/index'
// import customGetters from '../Store/Helpers/customGetters'
import * as sbFetch from './sbFetch'
import FileWatchers from '../FileSystem/FileWatchers'
import IpcController from './ipc.controller'
import youtubeDl from '../DownloadPhase/youtube-dl'
import connectionController from './connection.controller'
import protocolController from './protocol.controller'
import VUEX_MAIN from '../../Store/mainProcessStore'
import { v4 as uuid } from 'uuid'

import core from './core.controller'
import windowStateKeeper from 'electron-window-state'
import Positioner from 'electron-positioner'

import updater from './auto-update'

const openBrowser = global.openUrl = require('open')
export const ipcSend = (...args) => {
  if (!global.CONSTANTS.MAIN_WINDOW) return
  return IpcController.send(...args)
}

const ipcOnce = IpcController.once

let BROWSER_WINDOW
// let SESSION
let DIALOG

console.log('NODE ENV', process.env.NODE_ENV)

const loadingController = {
  target: [],
  count: 0,
  // -----------------------
  set (target, value) {
    this.count += value

    if (value > 0) this.target.push(target)
    else this.target.splice(this.target.indexOf(target), 1)

    this.reflect({ value: this.isLoading, target })
    return this.isLoading
  },
  reflect (payload = this.instance) {
    console.log('current', this.instance)
    ipcSend('LOADING_EVENT', payload)
  },
  // -----------------------
  get instance () {
    return { value: this.isLoading, target: this.which }
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
    this.reflect({ target: target, value: this.isLoading, ptg })
  },
  fn (val) {
    return function (target) {
      return this.set(target, val)
    }
  }
}

export function normalizeError (error) {
  if (error && error.response) return { status: error.response.status, data: error.response.data }
  return error
}

export function REFLECT_RENDERER () {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    ipcOnce(listenerId, resolve)
    ipcSend('VUEX:STORE', { state: VUEX_MAIN.STATE_SAFE(), listenerId })
  })
}
export function REFLECT_RENDERER_KEY (key) {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    ipcOnce(listenerId, resolve)
    const value = VUEX_MAIN.STATE_SAFE(key)[key]
    ipcSend('VUEX:SET', { key, value, listenerId })
  })
}
export function SEND_ERROR ({ type, error }) {
  return new Promise((resolve, reject) => {
    ipcSend('ERROR:CATCH', { type, error: normalizeError(error) })
  })
}

// ------------------------- FLOW -------------------------

export function init (electron) {
  setVars(electron)
  electron.app.allowRendererProcessReuse = true
  electron.app.on('ready', async () => {
    global.CONSTANTS.ENV_PROD && updater.init()
    protocolController.startProtocols(electron)
    connectionController.init({
      connectionChangeCallback: (value) => {
        ipcSend('CONNECTION:CHANGE', value)
      },
      apiConnectionChangeCallback: (value) => {
        ipcSend('API_CONNECTION:CHANGE', value)
      }
    })
    createMenu(electron)
    await core.setAppStatus()
    windowController.createWindow()
  })

  electron.app.on('window-all-closed', () => {
    if (global.CONSTANTS.PLATFORM !== 'mac') {
      // TODO Manage background processing on every platform
      electron.app.quit()
    }
  })

  electron.app.on('activate', () => {
    if (global.CONSTANTS.MAIN_WINDOW === null) windowController.createWindow()
  })

  electron.app.on('will-quit', () => {
    electron.globalShortcut.unregisterAll()
  })
}

const setVars = ({ app, BrowserWindow, session, dialog, shell }) => {
  global.CONSTANTS.BROWSER_WINDOW = BROWSER_WINDOW = BrowserWindow
  global.CONSTANTS.SESSION = session
  global.CONSTANTS.DIALOG = DIALOG = dialog
  global.CONSTANTS.SHELL_OPEN = shell.openItem
}

export async function askHomeFolder (e, { listenerId }) {
  let isLogged
  try {
    const { canceled, filePaths } = await DIALOG.showOpenDialog(global.CONSTANTS.MAIN_WINDOW, {
      properties: ['openDirectory']
    })
    if (canceled) throw new Error('CANCELLED')
    await addHomeFolder(null, { path: filePaths[0] })
    if (!await core.stateExists()) return
    isLogged = await core.setAppStatus()
    if (isLogged) return ipcSend('STATUS:SET')
  } catch (error) {
    console.error('EROR SETTING HOME FOLDER', error)
    e.sender.send(listenerId, { error })
  } finally {
    e.sender.send(listenerId, { isLogged })
  }
}

export async function addHomeFolder (e, { path, listenerId }) {
  let error
  try {
    await core.addHomeFolder(path)
    if (e && listenerId) return e.sender.send(listenerId, {})
  } catch (err) {
    error = err
    if (e && listenerId) return e.sender.send(listenerId, { error })
    throw error
  }
}

export async function setHomeFolder (e, { path, listenerId }) {
  let error
  try {
    await addHomeFolder(e, { path })
    await core.setAppStatus()
    if (e && listenerId) return e.sender.send(listenerId, {})
  } catch (err) {
    error = err
    if (e && listenerId) return e.sender.send(listenerId, { error })
    throw error
  }
}

export async function openHomeFolder (e, { listenerId }) {
  let error
  try {
    await global.CONSTANTS.SHELL_OPEN(global.HOME_FOLDER)
  } catch (err) {
    error = err
  } finally {
    e.sender.send(listenerId, error)
  }
}

const createMenu = ({ globalShortcut }) => {
  if (global.ENV_PROD) {
    globalShortcut.register('f5', global.emptyFn)
    globalShortcut.register('CmdOrCtrl+R', global.emptyFn)
  }
}

export const windowController = {
  windowState: null,
  positioner: null,
  lockWindow (e, setSize = true) {
    const window = global.CONSTANTS.MAIN_WINDOW
    if (!window) return
    setSize && window.setSize(global.CONSTANTS.MAIN_WINDOW_CONFIG.width, global.CONSTANTS.MAIN_WINDOW_CONFIG.height)
    window.resizable = false
    windowController.positioner.move('center')
  },
  unlockWindow (e, setSize = true, setPosition = true) {
    const window = global.CONSTANTS.MAIN_WINDOW
    if (!window) return

    const windowState = windowController.windowState

    window.resizable = true
    setTimeout(() => {
      setSize && window.setSize(windowState.width, windowState.height)
      setPosition && windowState.x && windowState.y && window.setPosition(windowState.x, windowState.y, true)
      windowState.manage(window)
    }, 500)
  },
  createWindow () {
    windowController.windowState = windowStateKeeper({
      defaultWidth: global.CONSTANTS.MAIN_WINDOW_CONFIG.width,
      defaultHeight: global.CONSTANTS.MAIN_WINDOW_CONFIG.height
    })
    const window = global.CONSTANTS.MAIN_WINDOW = new BROWSER_WINDOW({
      ...global.CONSTANTS.MAIN_WINDOW_CONFIG,
      width: global.CONSTANTS.MAIN_WINDOW_CONFIG.width,
      height: global.CONSTANTS.MAIN_WINDOW_CONFIG.height
    })
    window.setPositionSafe = window.setPosition
    window.setPosition = (x, y, animate = true) => window.setPositionSafe(x, y, animate)

    windowController.positioner = new Positioner(window)

    window.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)
    window.on('closed', () => {
      global.CONSTANTS.MAIN_WINDOW = null
      windowController.windowState = null
      windowController.positioner = null
    })
  }
}

export async function login (e, { listenerId }) {
  let error
  try {
    await core.initializeLogin()
    await REFLECT_RENDERER()
  } catch (err) {
    error = err
  } finally {
    e.sender.send(listenerId, error)
  }
}

export async function logout (e, { listenerId }) {
  let error
  try {
    if (!global.CONSTANTS.APP_STATUS.IS_LOGGED) throw new Error('NOT LOGGED IN')
    await core.logout()
  } catch (err) {
    error = err
    SEND_ERROR(err)
  } finally {
    const status = getAppStatus()
    status.error = error
    ipcSend(listenerId, status)
  }
}

const getAppStatus = () => {
  const status = global.CONSTANTS.APP_STATUS
  const all = {
    APP_STATUS: status,
    state: status.IS_LOGGED ? VUEX_MAIN.STATE_SAFE() : null,
    downloadedTracks: status.IS_LOGGED ? FileWatchers.retrieveTracks() : null,
    FFMPEG_BINS_DOWNLOADED: global.CONSTANTS.FFMPEG_BINS_DOWNLOADED,
    CONNECTED_TO_INTERNET: global.CONNECTED_TO_INTERNET,
    CONNECTED_TO_API: global.CONNECTED_TO_API
  }
  if (loadingController.instance.value && loadingController.instance.target === 'DOWNLOAD') setTimeout(youtubeDl.onDowloadStart)
  return all
}

export async function onFfmpegBinaries () {
  ipcSend('FFMPEG_BINS_DOWNLOADED', { value: global.CONSTANTS.FFMPEG_BINS_DOWNLOADED })
}

export async function sendStatus (e, { listenerId }) {
  e.sender.send(listenerId, getAppStatus())
}

// ------- EXTERNAL SOURCES -------
export async function refresh () {
  try {
    let completed = 0
    if (!loadingController.canRequest) return
    loadingController.on('PLAYLISTS:REFRESH')
    await core.updateAll({
      playlistCompletionCallback: (err, pl, playlists) => {
        if (err) {
        }
        loadingController.ptg('PLAYLISTS:REFRESH', (++completed / playlists.length))
      }
    })
  } catch (error) {
    SEND_ERROR({ type: 'PLAYLISTS:REFRESH', error })
  } finally {
    console.log('before loadoff')
    loadingController.off('PLAYLISTS:REFRESH')
    await REFLECT_RENDERER()
  }
}

export async function loadMorePlaylists () {
  try {
    if (!loadingController.canRequest) return
    loadingController.on('PLAYLISTS:LOAD_MORE')
    await core.loadMorePlaylists()
  } catch (error) {
    SEND_ERROR({ type: 'PLAYLISTS:LOAD_MORE', error })
    throw error
  } finally {
    loadingController.off('PLAYLISTS:LOAD_MORE')
    await REFLECT_RENDERER()
  }
}

export async function youtubize () {
  try {
    let completed = 0
    if (!loadingController.canRequest) return
    loadingController.on('YOUTUBIZE')
    await core.youtubize({
      trackCompletionCallback: total => {
        loadingController.ptg('YOUTUBIZE', (++completed / total))
      }
    })
  } catch (error) {
    SEND_ERROR({ type: 'YOUTUBIZE', error })
    throw error
  } finally {
    loadingController.off('YOUTUBIZE')
    await REFLECT_RENDERER()
  }
}

export async function download (e, plFilter) {
  if (!loadingController.canRequest) return console.log('CANT REQUEST')
  console.log('About to download')
  if (plFilter && !Array.isArray(plFilter)) plFilter = [plFilter]
  try {
    loadingController.on('DOWNLOAD')
    const tracks = await FSController.UserMethods.retrieveLocalTracks()
    await youtubeDl.downloadSyncedPlaylists(tracks, plFilter)
    // await FileWatchers.rebuildWatchers()
    loadingController.off('DOWNLOAD')
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
    if (loadingController.isLoading) return
    loadingController.on('PLAYLIST:UNSYNC')
    await VUEX_MAIN.COMMIT.UNSYNC_PLAYLIST(id)
  } catch (error) {
    console.error('Error unsyncing @ handlers.unsyncPlaylist', error)
    SEND_ERROR({ type: 'PLAYLIST:UNSYNC', error })
    throw error
  } finally {
    loadingController.off('PLAYLIST:UNSYNC')
    await REFLECT_RENDERER()
  }
}

export async function pausePlaylist (id) {
  try {
    if (loadingController.isLoading) return
    VUEX_MAIN.COMMIT.PAUSE_PLAYLIST(id)
  } catch (error) {
    console.error('Error pausing playlist @ handlers.pausePlaylist', error)
    SEND_ERROR({ type: 'PLAYLIST:PAUSE', error })
    throw error
  } finally {
    await REFLECT_RENDERER_KEY('playlists')
  }
}

export async function pauseTrack (id) {
  try {
    if (loadingController.isLoading) return
    VUEX_MAIN.COMMIT.PAUSE_TRACK(id)
  } catch (error) {
    console.error('Error pausing track @ handlers.pauseTrack', error)
    SEND_ERROR({ type: 'TRACKS:PAUSE', error })
    throw error
  } finally {
    await REFLECT_RENDERER_KEY('convertedTracks')
  }
}

export async function changeYtTrackSelection ({ trackId, newId }) {
  try {
    if (loadingController.isLoading) return
    VUEX_MAIN.COMMIT.CHANGE_YT_TRACK_SELECTION({ trackId, newId })
  } catch (err) {
    console.error('Error changing track selection', err)
    throw err
  } finally {
    await REFLECT_RENDERER_KEY('convertedTracks')
  }
}

export async function getYtTrackDetails (event, { url, trackId, listenerId }) {
  if (!loadingController.canRequest) return
  try {
    const details = await sbFetch.ytDetails(url)
    console.log('YT Details retrieved', details)
    VUEX_MAIN.COMMIT.CUSTOM_TRACK_URL({ details, trackId })
    await REFLECT_RENDERER_KEY('convertedTracks')
    event.sender.send(listenerId)
  } catch (err) {
    console.error('EROR AT YTTRACKDETAILS:: ipc"ytTrackDetails"', err)
    event.sender.send(listenerId + ':ERROR')
  }
}

export function openYtVideo (event, id) {
  if (!id) return
  openBrowser('https://www.youtube.com/watch?v=' + id)
}

export function searchYtVideo (event, query) {
  if (!query) return
  openBrowser('https://www.youtube.com/results?search_query=' + query)
}

export function showChangelog (event, query) {
  global.openUrl(global.CONSTANTS.CHANGELOG_URL)
}
