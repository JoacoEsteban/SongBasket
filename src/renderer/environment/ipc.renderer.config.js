// import { ipcRenderer } from 'electron'
import { ipcRenderer } from 'electron-better-ipc'
import $ from 'jquery'
import { sleep } from '../utils'
import vue from '../controllers/VueInstance'

const ipc = ipcRenderer

const env = {
  propagationTimeout: null,
  propagationTrackQueue: []
}
export default function (Vue) {
  Vue.prototype.$IPC = ipcRenderer
  console.log(ipc)

  ipc.answerMain('STATUS:SET', onDocumentReady)
  ipc.answerMain('FFMPEG_BINS_DOWNLOADED', onFfmpegBinaries)
  ipc.answerMain('LOADING_EVENT', onLoadingEvent)
  ipc.answerMain('ERROR:CATCH', async ({ type, error }) => {
    await vue.store.dispatch('catchGlobalError', { type, error })
  })
  ipc.answerMain('CONNECTION:CHANGE', onConnectionChange)
  ipc.answerMain('API_CONNECTION:CHANGE', onApiConnectionChange)
  ipc.answerMain('FileWatchers:ADDED', onAddedTrack)
  ipc.answerMain('FileWatchers:REMOVED', onRemovedTrack)
  ipc.answerMain('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.answerMain('VUEX:STORE', storeState)
  ipc.answerMain('VUEX:SET', async ({ key, value }) => {
    await vue.store.dispatch('set', { key, value })
  })
  ipc.answerMain('DOWNLOAD:START', (payload) => vue.store.dispatch('downloadStarted', payload))
  ipc.answerMain('DOWNLOAD:EVENT', (payload) => vue.store.dispatch('downloadEvent', payload))
  ipc.answerMain('DOWNLOAD:END', async (payload) => vue.store.dispatch('downloadFinished', payload))

  // ipc.on('READY_TO_UPDATE', readyToUpdate)

  $(document).ready(onDocumentReady)
}

async function storeState ({ state, dontFormat }) {
  await vue.store.dispatch('setState', state)
  !dontFormat && vue.controllers.core.formatConvertedTracks()
  await vue.store.dispatch('stateReplaced')
}
async function onFfmpegBinaries ({ value }) {
  vue.store.dispatch('ffmpegBinsDownloaded', value)
}
async function onConnectionChange (val) {
  vue.store.dispatch('connectionChange', val)
}
async function onApiConnectionChange (val) {
  vue.store.dispatch('apiConnectionChange', val)
}
async function onLoadingEvent (payload) {
  vue.store.dispatch('loadingEvent', payload)
}

window.retrieveStatus = async () => {
  const status = await vue.ipc.callMain('GET_STATUS')
  console.log('Setting app status', status)
  if (status.APP_STATUS.IS_LOGGED) {
    await storeState({ state: status.state, dontFormat: true })
    await onRetrievedTracks(status.downloadedTracks)
    await onFfmpegBinaries({ value: status.FFMPEG_BINS_DOWNLOADED })
    await vue.store.dispatch('SETUP_LOADING_STATE', 'found')
    await redirect('home')
    setTimeout(() => {
      onConnectionChange(status.CONNECTED_TO_INTERNET)
      onApiConnectionChange(status.CONNECTED_TO_API)
    }, 1000)
    vue.ipc.callMain('WINDOW:UNLOCK')
    return
  }

  let path = 'setup'

  if (status.APP_STATUS.FOLDERS.paths.length && window.CONSTANTS.FEATURES.FOLDER_VIEW) {
    path = 'folder-view'
    vue.ipc.callMain('WINDOW:UNLOCK')
  }
  redirect(path)
}

function onDocumentReady () {
  if (!window.VUE_HAS_MOUNTED) return setTimeout(onDocumentReady, 100)
  window.retrieveStatus()
}
async function onRetrievedTracks (tracks = {}) {
  console.log('RETRIEVED', Object.keys(tracks).length)
  for (const primKey in tracks) {
    for (const secKey in tracks[primKey]) {
      tracks[primKey][secKey].playlists = tracks[primKey][secKey].playlists.map(p => getPlaylistIdFromFoldername(p))
    }
  }
  vue.root.DOWNLOADED_TRACKS = tracks
  vue.controllers.core.formatConvertedTracks()
}
function getPlaylistIdFromFoldername (name) {
  const pl = vue.store.state.CurrentUser.playlists.find(p => p.folderName === name || p.name === name)
  return pl && pl.id
}

function onAddedTrack (track) {
  console.log('track added')
  const tracks = vue.root.DOWNLOADED_TRACKS

  if (!tracks[track.spotify_id]) tracks[track.spotify_id] = {}
  if (!tracks[track.spotify_id][track.youtube_id]) tracks[track.spotify_id][track.youtube_id] = { playlists: [] }

  const id = getPlaylistIdFromFoldername(track.playlist)
  if (!id) return
  tracks[track.spotify_id][track.youtube_id].playlists.push(id)

  propagateFileChange({ ...track, playlistId: id })
}
function onRemovedTrack (track) {
  const tracks = vue.root.DOWNLOADED_TRACKS

  if (!tracks[track.spotify_id] || !tracks[track.spotify_id][track.youtube_id]) return
  const trackRef = tracks[track.spotify_id][track.youtube_id]
  const id = getPlaylistIdFromFoldername(track.playlist)
  if (!id) return

  trackRef.playlists = trackRef.playlists.filter(p => p !== id)
  if (!trackRef.playlists.length) {
    tracks[track.spotify_id][track.youtube_id] = undefined
  }
  propagateFileChange({ ...track, playlistId: id })
}
function propagateFileChange (track) {
  const path = vue.sbRouter.giveMeCurrent() || {}
  env.propagationTrackQueue.push(track.spotify_id)

  if (env.propagationTimeout) clearTimeout(env.propagationTimeout)
  env.propagationTimeout = setTimeout(() => {
    vue.controllers.core.formatConvertedTracks({ trackFilter: (env.propagationTrackQueue.length && env.propagationTrackQueue) || null })
    env.propagationTrackQueue = []
    env.propagationTimeout = null

    switch (path.name) {
      case 'playlist-view':
        if (path.params.id !== track.playlistId) break
        vue.root.PlaylistViewInstance.computeTracks()
        break
      case 'home':
    }
  }, 200)
}

async function redirect (path, payload) {
  await sleep(1000)
  path = (path[0] === '/' ? '' : '/') + path
  if (path === vue.instance.$route.fullPath) return console.error('ERROR Trying to navigate to same path')
  vue.router.push(path)
}
