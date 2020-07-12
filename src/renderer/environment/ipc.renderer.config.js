import $ from 'jquery'
import { sleep } from '../utils'

let ipc
let VueInstance
const thisVue = () => (VueInstance || (VueInstance = require('../main').default))
const vue = {
  get ipc () {
    return thisVue().$IPC
  },
  get instance () {
    return thisVue()
  },
  get root () {
    return thisVue().$root
  },
  get store () {
    return thisVue().$store
  },
  get controllers () {
    return thisVue().$controllers
  }
}
const store = {
  get dispatch () {
    return thisVue().$store.dispatch
  }
}
const uuid = () => thisVue().$uuid()

const env = {
  propagationTimeout: null,
  propagationTrackQueue: []
}
export default function (Vue) {
  ipc = Vue.prototype.$IPC = require('electron').ipcRenderer

  ipc.on('STATUS:SET', onDocumentReady)
  ipc.on('FFMPEG_BINS_DOWNLOADED', onFfmpegBinaries)
  ipc.on('LOADING_EVENT', onLoadingEvent)
  ipc.on('ERROR:CATCH', async ({type, error}) => {
    await store.dispatch('catchGlobalError', {type, error})
  })
  ipc.on('CONNECTION:CHANGE', onConnectionChange)
  ipc.on('API_CONNECTION:CHANGE', onApiConnectionChange)
  ipc.on('FileWatchers:ADDED', onAddedTrack)
  ipc.on('FileWatchers:REMOVED', onRemovedTrack)
  ipc.on('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.on('VUEX:STORE', storeState)
  ipc.on('VUEX:SET', async (e, {key, value, listenerId}) => {
    await store.dispatch('set', {key, value})
    ipc.send(listenerId)
  })
  ipc.on('DOWNLOAD:START', (e, payload) => store.dispatch('downloadStarted', payload))
  ipc.on('DOWNLOAD:EVENT', (e, payload) => store.dispatch('downloadEvent', payload))
  ipc.on('DOWNLOAD:END', async (e, payload) => store.dispatch('downloadFinished', payload))

  // ipc.on('READY_TO_UPDATE', readyToUpdate)

  $(document).ready(onDocumentReady)
}

async function storeState (e, {state, listenerId, dontFormat}) {
  await store.dispatch('setState', state)
  !dontFormat && vue.controllers.core.formatConvertedTracks()
  await store.dispatch('stateReplaced')
  listenerId && ipc.send(listenerId)
}
async function onFfmpegBinaries (e, {value}) {
  store.dispatch('ffmpegBinsDownloaded', value)
}
function onConnectionChange (e, val) {
  store.dispatch('connectionChange', val)
}
function onApiConnectionChange (e, val) {
  store.dispatch('apiConnectionChange', val)
}
function onLoadingEvent (e, payload) {
  store.dispatch('loadingEvent', payload)
}

window.retrieveStatus = () => {
  return new Promise((resolve, reject) => {
    const listenerId = uuid()
    vue.ipc.once(listenerId, async (e, status) => {
      console.log('Setting app status', status)
      if (status.APP_STATUS.IS_LOGGED) {
        await storeState(null, { state: status.state, listenerId: null, dontFormat: true })
        await onRetrievedTracks(null, status.downloadedTracks)
        await onFfmpegBinaries(e, {value: status.FFMPEG_BINS_DOWNLOADED})
        await store.dispatch('SETUP_LOADING_STATE', 'found')
        await redirect('home')
        setTimeout(() => {
          onConnectionChange(null, status.CONNECTED_TO_INTERNET)
          onApiConnectionChange(null, status.CONNECTED_TO_API)
        }, 1000)
        vue.ipc.send('WINDOW:UNLOCK')
        return resolve()
      }
      let path = 'setup'
      if (status.APP_STATUS.FOLDERS.paths.length) (path = 'folder-view') && vue.ipc.send('WINDOW:UNLOCK')
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

  propagateFileChange({...track, playlistId: id})
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
  propagateFileChange({...track, playlistId: id})
}
function propagateFileChange (track) {
  const path = thisVue().$sbRouter.giveMeCurrent() || {}
  env.propagationTrackQueue.push(track.spotify_id)

  if (env.propagationTimeout) clearTimeout(env.propagationTimeout)
  env.propagationTimeout = setTimeout(() => {
    vue.controllers.core.formatConvertedTracks({trackFilter: (env.propagationTrackQueue.length && env.propagationTrackQueue) || null})
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
  if (path === thisVue().$route.fullPath) return console.error('ERROR Trying to navigate to same path')
  thisVue().$router.push(path)
}
