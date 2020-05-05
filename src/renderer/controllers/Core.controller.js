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
