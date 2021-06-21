import env from './VueInstance'

const CoreController = {
  async queuePlaylist (id) {
    await env.ipc.callMain('PLAYLISTS:QUEUE', id)
  },
  async loadMorePlaylists () {
    await env.ipc.callMain('PLAYLISTS:LOAD_MORE')
  },
  async unsyncPlaylist (id) {
    await env.ipc.callMain('PLAYLISTS:UNSYNC', { id })
    await env.store.dispatch('playlistUnsynced')
  },
  async changeYtTrackSelection ({ trackId, newId }) {
    env.ipc.callMain('TRACK:CHANGE_SELECTION', { trackId, newId })
    CoreController.formatConvertedTracks({ trackFilter: [trackId] })
  },
  formatConvertedTracks (params = { plFilter: null, trackFilter: null }) {
    const rootTracks = env.root.CONVERTED_TRACKS_FORMATTED
    const vuexTracks = env.store.state.CurrentUser.convertedTracks
    const { plFilter, trackFilter } = params

    if (!rootTracks || !(trackFilter || plFilter)) return (env.root.CONVERTED_TRACKS_FORMATTED = vuexTracks.map(formatTrack)) + emitEvent()
    if (trackFilter) {
      trackFilter.forEach(id => {
        rootTracks[rootTracks.indexOfSearch(t => t.id === id)] = formatTrack(vuexTracks.find(t => t.id === id))
      })
    }
    if (plFilter) {
      vuexTracks.filter(t => t.playlists.some(pl => plFilter.includes(pl.id))).forEach(track => {
        rootTracks[rootTracks.indexOfSearch(t => t.id === track.id)] = formatTrack(track)
      })
    }

    emitEvent()
  },
  async refresh () {
    const loading = env.store.state.Events.LOADING_STATE || {}
    if (loading.value) return
    env.sbRouter.push({ name: 'home', params: { which: 'playlists-list' } })
    await env.ipc.callMain('REFRESH')
  },
  async download (playlistFilter) {
    const loading = env.store.state.Events.LOADING_STATE || {}
    if (!loading.value) await env.ipc.callMain('download', playlistFilter)
    env.sbRouter.push({ name: 'downloads-view' })
  },
  async pausePlaylist (id) {
    const loading = env.store.state.Events.LOADING_STATE || {}
    if (loading.value) return
    await env.ipc.callMain('PLAYLISTS:PAUSE', { id })
  },
  async pauseTrack (id) {
    const loading = env.store.state.Events.LOADING_STATE || {}
    if (loading.value) return
    await env.ipc.callMain('TRACK:PAUSE', { id })
  },
  askTrackCustomUrl (trackId) {
    return new Promise((resolve, reject) => {
      env.root.OPEN_MODAL({ wich: 'custom-track-url', payload: { trackId, cb: resolve, cancelCB: reject } })
    })
  },
  async askRemoveFolder (payload) {
    console.log('vamos', env)
    env.root.OPEN_MODAL({ wich: 'delete-folder', payload })
  },
  async reviewTrack (track) {
    env.sbRouter.push({ name: 'track-review', params: { track } })
  },
  async openVideo (id) {
    if (!id) return
    await env.ipc.callMain('VIDEO:OPEN', id)
  },
  async searchYt (track) {
    const query = track.query && track.query.query
    if (!query) return
    await env.ipc.callMain('VIDEO:SEARCH', query)
  },
  async logOut () {
    if (!global.CONSTANTS.APP_STATUS.IS_LOGGED) return
    console.log('Logging Out:::::')

    const appStatus = await env.ipc.callMain('LOGOUT')

    if (appStatus.error) throw appStatus.error
    await env.instance.$store.dispatch('logout')
    env.root.DOWNLOADED_TRACKS = {}
    env.root.CONVERTED_TRACKS_FORMATTED = {}

    let path = 'folder-view'
    if (!appStatus.APP_STATUS.FOLDERS.paths.length || !window.CONSTANTS.FEATURES.FOLDER_VIEW) {
      env.ipc.callMain('WINDOW:LOCK')
      path = 'setup'
    }
    env.instance.$router.push(path)
  },
  async setHomeFolder (path) {
    await env.ipc.callMain('HOME_FOLDER:SET', { path })
    await window.retrieveStatus()
  },
  async openHomeFolder () {
    await env.ipc.callMain('HOME_FOLDER:OPEN')
  }
}

const emitEvent = () => env.store.dispatch('playlistTracksReComputed')

const formatTrack = track => {
  const trackSafe = env.instance.$jsonClone(track)

  env.controllers.track.populateTrackSelection(trackSafe)
  trackSafe.status = env.controllers.track.getStatus(trackSafe)

  return trackSafe
}

export default CoreController
