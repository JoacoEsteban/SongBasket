import { ipcRenderer } from 'electron'
import $ from 'jquery'
import { sleep } from '../utils'
import vue from '../controllers/VueInstance'

const ipc = ipcRenderer
const uuid = () => vue.instance.$uuid()

const env = {
  propagationTimeout: null,
  propagationTrackQueue: []
}
export default function (Vue) {
  Vue.prototype.$IPC = ipcRenderer

  ipc.on('STATUS:SET', onDocumentReady)
  ipc.on('FFMPEG_BINS_DOWNLOADED', onFfmpegBinaries)
  ipc.on('LOADING_EVENT', onLoadingEvent)
  ipc.on('ERROR:CATCH', async ({ type, error }) => {
    await vue.store.dispatch('catchGlobalError', { type, error })
  })
  ipc.on('CONNECTION:CHANGE', onConnectionChange)
  ipc.on('API_CONNECTION:CHANGE', onApiConnectionChange)
  ipc.on('FileWatchers:ADDED', onAddedTrack)
  ipc.on('FileWatchers:REMOVED', onRemovedTrack)
  ipc.on('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.on('VUEX:STORE', storeState)
  ipc.on('VUEX:SET', async (e, { key, value, listenerId }) => {
    await vue.store.dispatch('set', { key, value })
    ipc.send(listenerId)
  })
  ipc.on('DOWNLOAD:START', (e, payload) => vue.store.dispatch('downloadStarted', payload))
  ipc.on('DOWNLOAD:EVENT', (e, payload) => vue.store.dispatch('downloadEvent', payload))
  ipc.on('DOWNLOAD:END', async (e, payload) => vue.store.dispatch('downloadFinished', payload))

  // ipc.on('READY_TO_UPDATE', readyToUpdate)

  $(document).ready(onDocumentReady)
}

async function storeState (e, { state, listenerId, dontFormat }) {
  await vue.store.dispatch('setState', state)
  !dontFormat && vue.controllers.core.formatConvertedTracks()
  await vue.store.dispatch('stateReplaced')
  listenerId && ipc.send(listenerId)
}
async function onFfmpegBinaries (e, { value }) {
  vue.store.dispatch('ffmpegBinsDownloaded', value)
}
function onConnectionChange (e, val) {
  vue.store.dispatch('connectionChange', val)
}
function onApiConnectionChange (e, val) {
  vue.store.dispatch('apiConnectionChange', val)
}
function onLoadingEvent (e, payload) {
  vue.store.dispatch('loadingEvent', payload)
}

window.retrieveStatus = () => {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    vue.ipc.once(listenerId, async (e, status) => {
      console.log('Setting app status', status)
      if (status.APP_STATUS.IS_LOGGED) {
        await storeState(null, { state: status.state, listenerId: null, dontFormat: true })
        await onRetrievedTracks(null, status.downloadedTracks)
        await onFfmpegBinaries(e, { value: status.FFMPEG_BINS_DOWNLOADED })
        await vue.store.dispatch('SETUP_LOADING_STATE', 'found')
        await redirect('home')
        setTimeout(() => {
          onConnectionChange(null, status.CONNECTED_TO_INTERNET)
          onApiConnectionChange(null, status.CONNECTED_TO_API)
        }, 1000)
        vue.ipc.send('WINDOW:UNLOCK')
        return resolve()
      }
      let path = 'setup'
      console.log('dou?', window.CONSTANTS.FEATURES.FOLDER_VIEW)
      if (status.APP_STATUS.FOLDERS.paths.length && window.CONSTANTS.FEATURES.FOLDER_VIEW) (path = 'folder-view') && vue.ipc.send('WINDOW:UNLOCK')
      redirect(path)
      resolve()
    })
    vue.ipc.send('GET_STATUS', { listenerId })
  })
}

function onDocumentReady () {
  if (!window.VUE_HAS_MOUNTED) return setTimeout(onDocumentReady, 100)
  window.retrieveStatus()
}
async function onRetrievedTracks (e, tracks = {}) {
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

function onAddedTrack (e, track) {
  console.log('track added')
  const tracks = vue.root.DOWNLOADED_TRACKS

  if (!tracks[track.spotify_id]) tracks[track.spotify_id] = {}
  if (!tracks[track.spotify_id][track.youtube_id]) tracks[track.spotify_id][track.youtube_id] = { playlists: [] }

  const id = getPlaylistIdFromFoldername(track.playlist)
  if (!id) return
  tracks[track.spotify_id][track.youtube_id].playlists.push(id)

  propagateFileChange({ ...track, playlistId: id })
}
function onRemovedTrack (e, track) {
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
