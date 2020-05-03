let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const ipc = () => getVueInstance().$IPC
const uuid = () => getVueInstance().$uuid()
const vue = {
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
    ipc().send('PLAYLISTS:QUEUE', id)
  },
  unsyncPlaylist (id) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      ipc().once(listenerId, async (e, error) => {
        await vue.store.dispatch('playlistUnsynced')
        error ? reject(error) : resolve()
      })
      ipc().send('PLAYLISTS:UNSYNC', {id, listenerId})
    })
  },
  changeYtTrackSelection ({trackId, newId}) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      ipc().once(listenerId, (e, error) => {
        error ? reject(error) : (async () => {
          await vue.store.dispatch('reComputePlaylistTracks')
          resolve()
        })()
      })
      ipc().send('TRACK:CHANGE_SELECTION', {trackId, newId, listenerId})
    })
  },
  formatConvertedTracks (params = {plFilter: null, trackFilter: null}) {
    if (!vue.root.CONVERTED_TRACKS_FORMATTED) (params.plFilter = null) + (params.trackFilter = null)
    const {plFilter, trackFilter} = params

    vue.root.CONVERTED_TRACKS_FORMATTED = (vue.root.CONVERTED_TRACKS_FORMATTED || vue.store.state.CurrentUser.convertedTracks).map(track => {
      if (trackFilter && !trackFilter.some(id => track.id === id)) return track
      if (plFilter && !plFilter.some(id => track.playlists.some(pl => pl.id === id))) return track

      const trackSafe = vue.instance.$jsonClone(track)

      vue.controllers.track.populateTrackSelection(trackSafe)
      trackSafe.status = vue.controllers.track.getStatus(trackSafe)

      return trackSafe
    })
    vue.store.dispatch('playlistTracksReComputed')
  }
}

export default CoreController
