let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const uuid = () => getVueInstance().$uuid()
const vue = {
  get ipc () {
    return getVueInstance().$IPC
  },
  get instance () {
    return getVueInstance()
  },
  get root () {
    return getVueInstance().$root
  },
  get store () {
    return getVueInstance().$store
  },
  get controllers () {
    return getVueInstance().$controllers
  },
  get sbRouter () {
    return getVueInstance().$sbRouter
  }
}
const CoreController = {
  queuePlaylist (id) {
    vue.ipc.send('PLAYLISTS:QUEUE', id)
  },
  loadMorePlaylists () {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      vue.ipc.once(listenerId, async (e, error) => error ? reject(error) : resolve())
      vue.ipc.send('PLAYLISTS:LOAD_MORE', { listenerId })
    })
  },
  unsyncPlaylist (id) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      vue.ipc.once(listenerId, async (e, error) => {
        await vue.store.dispatch('playlistUnsynced')
        error ? reject(error) : resolve()
      })
      vue.ipc.send('PLAYLISTS:UNSYNC', {id, listenerId})
    })
  },
  changeYtTrackSelection ({trackId, newId}) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      vue.ipc.once(listenerId, (e, error) => {
        error ? reject(error) : (async () => {
          CoreController.formatConvertedTracks({trackFilter: [trackId]})
          resolve()
        })()
      })
      vue.ipc.send('TRACK:CHANGE_SELECTION', {trackId, newId, listenerId})
    })
  },
  formatConvertedTracks (params = {plFilter: null, trackFilter: null}) {
    const rootTracks = vue.root.CONVERTED_TRACKS_FORMATTED
    const vuexTracks = vue.store.state.CurrentUser.convertedTracks
    const {plFilter, trackFilter} = params

    if (!rootTracks || !(trackFilter || plFilter)) return (vue.root.CONVERTED_TRACKS_FORMATTED = vuexTracks.map(formatTrack)) + emitEvent()
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
    const loading = vue.store.state.Events.LOADING_STATE || {}
    if (loading.value) return
    vue.ipc.send('REFRESH')
    vue.sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
  },
  download (playlistFilter) {
    const loading = vue.store.state.Events.LOADING_STATE || {}
    if (!loading.value) vue.ipc.send('download', playlistFilter)
    vue.sbRouter.push({name: 'downloads-view'})
  },
  pausePlaylist (id) {
    return new Promise((resolve, reject) => {
      const loading = vue.store.state.Events.LOADING_STATE || {}
      if (loading.value) return
      const listenerId = uuid()
      vue.ipc.once(listenerId, (e, error) => error ? reject(error) : resolve())
      vue.ipc.send('PLAYLISTS:PAUSE', {id, listenerId})
    })
  },
  pauseTrack (id) {
    return new Promise((resolve, reject) => {
      const loading = vue.store.state.Events.LOADING_STATE || {}
      if (loading.value) return
      const listenerId = uuid()
      vue.ipc.once(listenerId, (e, error) => error ? reject(error) : resolve())
      vue.ipc.send('TRACK:PAUSE', {id, listenerId})
    })
  },
  askTrackCustomUrl (trackId) {
    return new Promise((resolve, reject) => {
      vue.root.OPEN_MODAL({wich: 'custom-track-url', payload: {trackId, cb: resolve, cancelCB: reject}})
    })
  },
  reviewTrack (track) {
    vue.sbRouter.push({name: 'track-review', params: {track}})
  },
  openVideo (id) {
    if (!id) return
    vue.ipc.send('VIDEO:OPEN', id)
  },
  searchYt (track) {
    const query = track.query && track.query.query
    if (!query) return
    vue.ipc.send('VIDEO:SEARCH', query)
  },
  async logOut () {
    try {
      if (!global.CONSTANTS.APP_STATUS.IS_LOGGED) return
      console.log('Logging Out:::::')
      const listenerId = uuid()
      vue.ipc.once(listenerId, async (e, appStatus) => {
        try {
          if (appStatus.error) throw appStatus.error
          await getVueInstance().$store.dispatch('logout')
          vue.root.DOWNLOADED_TRACKS = {}
          vue.root.CONVERTED_TRACKS_FORMATTED = {}

          let path = 'folder-view'
          if (!appStatus.APP_STATUS.FOLDERS.paths.length) {
            vue.ipc.send('WINDOW:LOCK')
            path = 'setup'
          }
          getVueInstance().$router.push(path)
        } catch (error) {
          throw error
        }
      })
      vue.ipc.send('LOGOUT', {listenerId})
    } catch (error) {
      throw error
    }
  },
  async setHomeFolder (path) {
    try {
      const listenerId = uuid()
      vue.ipc.once(listenerId, async (e, {error}) => {
        if (error) throw error
        await window.retrieveStatus()
      })
      vue.ipc.send('HOME_FOLDER:SET', {path, listenerId})
    } catch (error) {
      throw error
    }
  },
  async openHomeFolder () {
    try {
      const listenerId = uuid()
      vue.ipc.once(listenerId, async (e, error) => {
        if (error) throw error
      })
      vue.ipc.send('HOME_FOLDER:OPEN', {listenerId})
    } catch (error) {
      throw error
    }
  }
}

const emitEvent = () => vue.store.dispatch('playlistTracksReComputed')

const formatTrack = track => {
  const trackSafe = vue.instance.$jsonClone(track)

  vue.controllers.track.populateTrackSelection(trackSafe)
  trackSafe.status = vue.controllers.track.getStatus(trackSafe)

  return trackSafe
}

export default CoreController
