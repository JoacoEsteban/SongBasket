import $ from 'jquery'
import { sleep } from '../utils'

let ipc
let VueInstance
const thisVue = () => (VueInstance || (VueInstance = require('../main').default))
const store = {
  get dispatch () {
    return thisVue().$store.dispatch
  }
}

const env = {
  propagationTimeout: null,
  propagationTrackQueue: []
}
export default function (Vue) {
  ipc = Vue.prototype.$IPC = require('electron').ipcRenderer

  ipc.on('LOADING_EVENT', onLoadingEvent)
  ipc.on('ERROR:CATCH', async ({type, error}) => {
    await store.dispatch('catchGlobalError', {type, error})
  })
  ipc.on('Connection:CHANGE', onConnectionChange)
  ipc.on('apiConnection:CHANGE', onApiConnectionChange)
  ipc.on('FileWatchers:ADDED', onAddedTrack)
  ipc.on('FileWatchers:REMOVED', onRemovedTrack)
  ipc.on('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.on('VUEX:STORE', async (e, {state, listenerId}) => {
    await store.dispatch('setState', state)
    ipc.send(listenerId)
  })
  ipc.on('VUEX:SET', async (e, {key, value, listenerId}) => {
    await store.dispatch('set', {key, value})
    ipc.send(listenerId)
  })
  ipc.on('initializeSetup', () => {
    redirect('setup')
  })
  ipc.on('dataStored', async () => {
    await store.dispatch('SETUP_LOADING_STATE', 'found')
    await redirect('home')
  })

  ipc.on('DOWNLOAD:START', (e, payload) => store.dispatch('downloadStarted', payload))
  ipc.on('DOWNLOAD:EVENT', (e, payload) => store.dispatch('downloadEvent', payload))

  $(document).ready(onDocumentReady)
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
function onDocumentReady () {
  setTimeout(() => {
    ipc.send('DOCUMENT_READY_CALLBACK')
  }, 1000)
  setTimeout(() => {
    ipc.send('FileWatchers:ASK_TRACKS')
  }, 5000)
}
async function onRetrievedTracks (e, tracks) {
  for (const primKey in tracks) {
    for (const secKey in tracks[primKey]) {
      tracks[primKey][secKey].playlists = tracks[primKey][secKey].playlists.map(p => getPlaylistIdFromFoldername(p))
    }
  }
  thisVue().$root.DOWNLOADED_TRACKS = tracks
  await store.dispatch('reComputePlaylistTracks')
}
function getPlaylistIdFromFoldername (name) {
  const pl = thisVue().$store.state.CurrentUser.playlists.find(p => p.folderName === name || p.name === name)
  return pl && pl.id
}

function onAddedTrack (e, track) {
  console.log('track added')
  const tracks = thisVue().$root.DOWNLOADED_TRACKS

  if (!tracks[track.spotify_id]) tracks[track.spotify_id] = {}
  if (!tracks[track.spotify_id][track.youtube_id]) tracks[track.spotify_id][track.youtube_id] = { playlists: [] }

  const id = getPlaylistIdFromFoldername(track.playlist)
  if (!id) return
  tracks[track.spotify_id][track.youtube_id].playlists.push(id)

  propagateFileChange({...track, playlistId: id})
}
function onRemovedTrack (e, track) {
  const tracks = thisVue().$root.DOWNLOADED_TRACKS

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
  switch (path.name) {
    case 'playlist-view':
      if (path.params.id !== track.playlistId) return
      env.propagationTrackQueue.push(track.spotify_id)

      if (env.propagationTimeout) clearTimeout(env.propagationTimeout)
      env.propagationTimeout = setTimeout(() => {
        thisVue().$root.FORMAT_CONVERTED_TRACKS({trackFilter: (env.propagationTrackQueue.length && env.propagationTrackQueue) || null})
        thisVue().$root.PlaylistViewInstance.computeTracks()
        env.propagationTrackQueue = []
        env.propagationTimeout = null
      }, 200)
      break
  }
}

async function redirect (path, payload) {
  console.log('dale', sleep)
  await sleep(1000)
  path = (path[0] === '/' ? '' : '/') + path
  if (path === thisVue().$route.fullPath) return console.error('ERROR Trying to navigate to same path')
  thisVue().$router.push(path)
}
