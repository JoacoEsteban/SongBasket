import $ from 'jquery'
import { sleep } from '../utils'

let ipc
let VueInstance
const thisVue = () => (VueInstance || (VueInstance = require('../main').default))
const env = {}
export default function (Vue) {
  ipc = Vue.prototype.$IPC = require('electron').ipcRenderer

  ipc.on('LOADING_EVENT', onLoadingEvent)
  ipc.on('Connection:CHANGE', onConnectionChange)
  ipc.on('FileWatchers:ADDED', onAddedTrack)
  ipc.on('FileWatchers:REMOVED', onRemovedTrack)
  ipc.on('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.on('VUEX:STORE', async (e, {state, listenerId}) => {
    await thisVue().$store.dispatch('setState', state)
    ipc.send(listenerId)
  })
  ipc.on('VUEX:SET', async (e, {key, value, listenerId}) => {
    await thisVue().$store.dispatch('set', {key, value})
    ipc.send(listenerId)
  })
  ipc.on('initializeSetup', () => {
    redirect('setup')
  })
  ipc.on('dataStored', async () => {
    await thisVue().$store.dispatch('SETUP_LOADING_STATE', 'found')
    await redirect('home')
  })

  ipc.on('DOWNLOAD:START', (e, payload) => thisVue().$store.dispatch('downloadStarted', payload))
  ipc.on('DOWNLOAD:EVENT', (e, payload) => thisVue().$store.dispatch('downloadEvent', payload))

  $(document).ready(onDocumentReady)
}

function onConnectionChange (e, val) {
  thisVue().$store.dispatch('connectionChange', val)
}
function onLoadingEvent (e, payload) {
  thisVue().$store.dispatch('loadingEvent', payload)
}
function onDocumentReady () {
  setTimeout(() => {
    ipc.send('DOCUMENT_READY_CALLBACK')
  }, 1000)
  setTimeout(() => {
    ipc.send('FileWatchers:ASK_TRACKS')
  }, 5000)
}
function onRetrievedTracks (e, tracks) {
  for (const primKey in tracks) {
    for (const secKey in tracks[primKey]) {
      tracks[primKey][secKey].playlists = tracks[primKey][secKey].playlists.map(p => getPlaylistIdFromFoldername(p))
    }
  }
  thisVue().$root.DOWNLOADED_TRACKS = tracks
}
function getPlaylistIdFromFoldername (name) {
  const pl = thisVue().$store.state.CurrentUser.playlists.find(p => p.folderName === name || p.name === name)
  return pl && pl.id
}

function onAddedTrack (e, track) {
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
      if (env.propagationTimeout) clearTimeout(env.propagationTimeout)
      env.propagationTimeout = setTimeout(() => {
        thisVue().$root.PlaylistViewInstance.computeTracks()
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
