const env = require('./VueInstance')
const uuid = () => env.instance.$uuid()

const CoreController = {
  queuePlaylist (id) {
    env.ipc.send('PLAYLISTS:QUEUE', id)
  },
  loadMorePlaylists () {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      env.ipc.once(listenerId, async (e, error) => error ? reject(error) : resolve())
      env.ipc.send('PLAYLISTS:LOAD_MORE', { listenerId })
    })
  },
  unsyncPlaylist (id) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      env.ipc.once(listenerId, async (e, error) => {
        await env.store.dispatch('playlistUnsynced')
        error ? reject(error) : resolve()
      })
      env.ipc.send('PLAYLISTS:UNSYNC', {id, listenerId})
    })
  },
  changeYtTrackSelection ({trackId, newId}) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      env.ipc.once(listenerId, (e, error) => {
        error ? reject(error) : (async () => {
          CoreController.formatConvertedTracks({trackFilter: [trackId]})
          resolve()
        })()
      })
      env.ipc.send('TRACK:CHANGE_SELECTION', {trackId, newId, listenerId})
    })
  },
  formatConvertedTracks (params = {plFilter: null, trackFilter: null}) {
    const rootTracks = env.root.CONVERTED_TRACKS_FORMATTED
    const vuexTracks = env.store.state.CurrentUser.convertedTracks
    const {plFilter, trackFilter} = params

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
    env.ipc.send('REFRESH')
    env.sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
  },
  download (playlistFilter) {
    const loading = env.store.state.Events.LOADING_STATE || {}
    if (!loading.value) env.ipc.send('download', playlistFilter)
    env.sbRouter.push({name: 'downloads-view'})
  },
  pausePlaylist (id) {
    return new Promise((resolve, reject) => {
      const loading = env.store.state.Events.LOADING_STATE || {}
      if (loading.value) return
      const listenerId = uuid()
      env.ipc.once(listenerId, (e, error) => error ? reject(error) : resolve())
      env.ipc.send('PLAYLISTS:PAUSE', {id, listenerId})
    })
  },
  pauseTrack (id) {
    return new Promise((resolve, reject) => {
      const loading = env.store.state.Events.LOADING_STATE || {}
      if (loading.value) return
      const listenerId = uuid()
      env.ipc.once(listenerId, (e, error) => error ? reject(error) : resolve())
      env.ipc.send('TRACK:PAUSE', {id, listenerId})
    })
  },
  askTrackCustomUrl (trackId) {
    return new Promise((resolve, reject) => {
      env.root.OPEN_MODAL({wich: 'custom-track-url', payload: {trackId, cb: resolve, cancelCB: reject}})
    })
  },
  reviewTrack (track) {
    env.sbRouter.push({name: 'track-review', params: {track}})
  },
  openVideo (id) {
    if (!id) return
    env.ipc.send('VIDEO:OPEN', id)
  },
  searchYt (track) {
    const query = track.query && track.query.query
    if (!query) return
    env.ipc.send('VIDEO:SEARCH', query)
  },
  async logOut () {
    try {
      if (!global.CONSTANTS.APP_STATUS.IS_LOGGED) return
      console.log('Logging Out:::::')
      const listenerId = uuid()
      env.ipc.once(listenerId, async (e, appStatus) => {
        try {
          if (appStatus.error) throw appStatus.error
          await env.instance.$store.dispatch('logout')
          env.root.DOWNLOADED_TRACKS = {}
          env.root.CONVERTED_TRACKS_FORMATTED = {}

          let path = 'folder-view'
          if (!appStatus.APP_STATUS.FOLDERS.paths.length) {
            env.ipc.send('WINDOW:LOCK')
            path = 'setup'
          }
          env.instance.$router.push(path)
        } catch (error) {
          throw error
        }
      })
      env.ipc.send('LOGOUT', {listenerId})
    } catch (error) {
      throw error
    }
  },
  async setHomeFolder (path) {
    try {
      const listenerId = uuid()
      env.ipc.once(listenerId, async (e, {error}) => {
        if (error) throw error
        await window.retrieveStatus()
      })
      env.ipc.send('HOME_FOLDER:SET', {path, listenerId})
    } catch (error) {
      throw error
    }
  },
  async openHomeFolder () {
    try {
      const listenerId = uuid()
      env.ipc.once(listenerId, async (e, error) => {
        if (error) throw error
      })
      env.ipc.send('HOME_FOLDER:OPEN', {listenerId})
    } catch (error) {
      throw error
    }
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
