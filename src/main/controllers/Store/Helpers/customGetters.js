import VUEX_MAIN from '../mainProcessStore'

const store = {
  get state () {
    return VUEX_MAIN.STATE()
  },
  get safe () {
    return VUEX_MAIN.STATE_SAFE()
  }
}
export default {
  // Gives spotify object
  get playlistsOffset () {
    return store.state.playlists.filter(pl => !store.state.syncedPlaylists.some(id => id === pl.id)).length
  },
  playlistById (id) {
    return store.safe.playlists.find(pl => pl.id === id)
  },
  SyncedPlaylistsSp () {
    const state = store.state
    let all = []
    let pls = [...state.playlists]
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let syncPl = state.syncedPlaylists[i]
      for (let o = 0; o < pls.length; o++) {
        let pl = pls[o]
        if (pl.id === syncPl) {
          all = [...all, pl]
          pls.splice(o, 1)
          break
        }
      }
    }
    return all
  },
  SyncedPlaylistsSp_SAFE () {
    return this.SyncedPlaylistsSp().filter(pl => !pl.isPaused)
  },
  get pausedPlaylists () {
    return store.state.syncedPlaylists.filter(id => {
      const pl = this.playlistById(id)
      return pl && pl.isPaused
    })
  },
  syncedPlaylistsSnapshots () {
    return store.state.syncedPlaylists.map(plid => {
      const { id, snapshot_id, isPaused } = store.state.playlists.find(pl => pl.id === plid)
      if (isPaused) return null
      return {
        id, snapshot_id
      }
    }).filter(pl => pl)
  },
  giveMePlFolderName (id) {
    const state = store.state
    const pl = state.playlists.find(pl => pl.id === id)
    if (!pl) console.log(id, pl, pl && pl.folderName, pl && pl.name)
    return pl && (pl.folderName || pl.name)
  },
  currentUserId () {
    return store.state.user && store.state.user.id
  },
  uncachedPlaylists () {
    return store.state.queuedPlaylists.filter(q => !store.state.cachedPlaylists.some(c => c.id === q))
  },
  convertedTracks () {
    return store.safe.convertedTracks
  },
  convertedTracks_SAFE () {
    return this.convertedTracks().filter(track => (track.conversion.yt.length || track.custom) && track.playlists.length)// TODO Prevent this filter from ever happening
  },
  anythingToConvert () {

  },
  queuedPlaylistsObj: () => {
    const state = store.state
    return state.queuedPlaylists.map(id => state.playlists.find(pl => pl.id === id))
  }
}
