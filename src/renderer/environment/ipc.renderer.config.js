import $ from 'jquery'

let ipc
let VueInstance
const thisVue = () => (VueInstance || (VueInstance = require('../main').default))
const env = {}
export default function (Vue) {
  ipc = Vue.prototype.$IPC = require('electron').ipcRenderer

  ipc.on('Connection:CHANGE', onConnectionChange)
  ipc.on('FileWatchers:ADDED', onAddedTrack)
  ipc.on('FileWatchers:REMOVED', onRemovedTrack)
  ipc.on('FileWatchers:RETRIEVED_TRACKS', onRetrievedTracks)
  ipc.on('VUEX:STORE', (e, state) => {
    thisVue().$store.dispatch('setState', state)
  })
  ipc.on('initializeSetup', () => {
    redirect('setup')
  })
  ipc.on('dataStored', async () => {
    await thisVue().$store.dispatch('SET_LOADING_STATE', 'found')
    redirect('home')
  })

  $(document).ready(onDocumentReady)
}

function onConnectionChange (e, val) {
  thisVue().$store.dispatch('connectionChange', val)
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

function redirect (path, payload) {
  path = (path[0] === '/' ? '' : '/') + path
  if (path === thisVue().$route.fullPath) return console.error('ERROR Trying to navigate to same path')
  thisVue().$router.push(path)
}
