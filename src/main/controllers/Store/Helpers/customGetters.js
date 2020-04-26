import VUEX_MAIN from '../mainProcessStore'

const CurrentUser = () => VUEX_MAIN.STATE()
export default {
  // Gives spotify object
  SyncedPlaylistsSp () {
    const state = CurrentUser()
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
  syncedPlaylistsSnapshots () {
    return CurrentUser().syncedPlaylists.map(plid => {
      const { id, snapshot_id } = CurrentUser().playlists.find(pl => pl.id === plid)
      return {
        id, snapshot_id
      }
    })
  },
  giveMePlFolderName (id) {
    const state = CurrentUser()
    const pl = state.playlists.find(pl => pl.id === id)
    if (!pl) console.log(id, pl, pl && pl.folderName, pl && pl.name)
    return pl && (pl.folderName || pl.name)
  },
  currentUserId () {
    return CurrentUser().user && CurrentUser().user.id
  },
  uncachedPlaylists () {
    return CurrentUser().queuedPlaylists.filter(q => !CurrentUser().cachedPlaylists.some(c => c === q))
  },
  convertedTracks () {
    return VUEX_MAIN.STATE().convertedTracks
  },
  anythingToConvert () {

  },
  queuedPlaylistsObj: () => {
    const state = CurrentUser()
    return state.queuedPlaylists.map(id => state.playlists.find(pl => pl.id === id))
  }
}
