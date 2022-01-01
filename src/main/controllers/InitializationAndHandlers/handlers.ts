import * as open from 'open'

import FSController from '../FileSystem/index'
// import customGetters from '../Store/Helpers/customGetters'
import * as sbFetch from './sbFetch'
import FileWatchers from '../FileSystem/FileWatchers'
// import IpcController from './ipc.controller'
import youtubeDl from '../DownloadPhase/youtube-dl'
import VUEX_MAIN from '../../Store/mainProcessStore'
// import { v4 as uuid } from 'uuid'

import core from './core.controller'
import { AppStatus, LoadingController, SongBasketSaveFile } from '../../../@types/SongBasket'
import { SpotifyPlaylistId, SpotifyTrackId } from '../../../@types/Spotify'
import { YouTubeResultId } from '../../../@types/YouTube'

const openBrowser = global.openUrl = open

// const ipcOnce = IpcController.once

console.log('NODE ENV', process.env.NODE_ENV)

const loadingController: LoadingController = {
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
  reflect (payload = loadingController.instance) {
    console.log('current', this.instance)
    global.ipcSend('LOADING_EVENT', payload)
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
    return (target) => {
      return this.set(target, val)
    }
  }
}

export function normalizeError (error: any) {
  if (error && error.response) {
    const { status, data } = error.response
    return { status, data }
  }
  return error
}

export async function REFLECT_RENDERER () {
  await global.ipcSend('VUEX:STORE', { state: VUEX_MAIN.STATE_SAFE() })
}
export async function REFLECT_RENDERER_KEY (key: keyof SongBasketSaveFile) {
  const value = VUEX_MAIN.STATE_SAFE([key])[key]
  await global.ipcSend('VUEX:SET', { key, value })
}
export async function SEND_ERROR (err: any) {
  const { type, error } = err || {}
  await global.ipcSend('ERROR:CATCH', { type, error: normalizeError(error) })
}

// ------------------------- FLOW -------------------------

export async function askHomeFolder () {
  let isLogged = false
  let error = null

  try {
    if (!global.CONSTANTS.MAIN_WINDOW) throw new Error('MAIN_WINDOW is not defined')

    const { canceled, filePaths } = await global.CONSTANTS.DIALOG.showOpenDialog(global.CONSTANTS.MAIN_WINDOW, {
      properties: ['openDirectory']
    })
    if (canceled) throw new Error('CANCELLED')
    await addHomeFolder({ path: filePaths[0] })
    if (await core.stateExists()) {
      isLogged = await core.setAppStatus()
      if (isLogged) {
        global.ipcSend('STATUS:SET')
      }
    }
  } catch (err) {
    console.error('EROR SETTING HOME FOLDER', err)
    error = err
  }
  return ({ isLogged, error })
}

export async function addHomeFolder (params: { path: string }): Promise<void> {
  const { path } = params
  await core.addHomeFolder(path)
}

export async function setHomeFolder (params: { path: string }): Promise<void> {
  const { path } = params
  await addHomeFolder({ path })
  await core.setAppStatus()
}

export async function openHomeFolder () {
  await global.CONSTANTS.SHELL_OPEN(global.HOME_FOLDER)
}

export async function login () {
  await core.initializeLogin()
  await REFLECT_RENDERER()
}

export async function logout () {
  let error
  try {
    if (!global.CONSTANTS.APP_STATUS.IS_LOGGED) throw new Error('NOT LOGGED IN')
    await core.logout()
  } catch (err) {
    error = err
    SEND_ERROR(err)
  }
  const status = getAppStatus()
  if (error instanceof Error) status.error = error
  return status
}

const getAppStatus = () => {
  const status = global.CONSTANTS.APP_STATUS
  const all: AppStatus = {
    APP_STATUS: status,
    state: status.IS_LOGGED ? (VUEX_MAIN.STATE_SAFE() as SongBasketSaveFile) : null,
    downloadedTracks: status.IS_LOGGED ? FileWatchers.retrieveTracks() : null,
    FFMPEG_BINS_DOWNLOADED: global.CONSTANTS.FFMPEG_BINS_DOWNLOADED,
    CONNECTED_TO_INTERNET: global.CONNECTED_TO_INTERNET,
    CONNECTED_TO_API: global.CONNECTED_TO_API,
    error: null
  }
  if (loadingController.instance.value && loadingController.instance.target === 'DOWNLOAD') setTimeout(youtubeDl.onDowloadStart)
  return all
}

export async function onFfmpegBinaries () {
  global.ipcSend('FFMPEG_BINS_DOWNLOADED', { value: global.CONSTANTS.FFMPEG_BINS_DOWNLOADED })
}

export async function sendStatus () {
  return getAppStatus()
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

export async function download (plFilter?: SpotifyPlaylistId[]) {
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

export async function queuePlaylist (id: SpotifyPlaylistId) {
  VUEX_MAIN.COMMIT.QUEUE_PLAYLIST(id)
  await REFLECT_RENDERER_KEY('queuedPlaylists')
}

export async function unsyncPlaylist (id: SpotifyPlaylistId) {
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

export async function pausePlaylist (id: SpotifyPlaylistId) {
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

export async function pauseTrack (id: SpotifyTrackId) {
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

export async function changeYtTrackSelection (params: { trackId: SpotifyTrackId, newId: YouTubeResultId }) {
  const { trackId, newId } = params
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

export async function getYtTrackDetails (params: { url: string, trackId: SpotifyTrackId }) {
  const { url, trackId } = params
  if (!loadingController.canRequest) return
  try {
    const details = await sbFetch.ytDetails(url)
    console.log('YT Details retrieved', details)
    VUEX_MAIN.COMMIT.CUSTOM_TRACK_URL({ details, trackId })
    await REFLECT_RENDERER_KEY('convertedTracks')
  } catch (err) {
    console.error('EROR AT YTTRACKDETAILS:: ipc"ytTrackDetails"', err)
    throw err
  }
}

export async function openYtVideo (id: YouTubeResultId) {
  if (!id) return
  openBrowser('https://www.youtube.com/watch?v=' + id)
}

export async function searchYtVideo (query: string) {
  if (!query) return
  openBrowser('https://www.youtube.com/results?search_query=' + query)
}

export async function showChangelog () {
  global.openUrl(global.CONSTANTS.CHANGELOG_URL)
}
