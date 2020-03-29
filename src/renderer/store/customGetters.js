import store from './index'

export default {
  // Gives spotify object
  SyncedPlaylistsSp () {
    let state = store.state.CurrentUser
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
  giveMePlFolderName (id) {
    let state = store.state.CurrentUser
    const pl = state.playlists.find(pl => pl.id === id)
    return pl && (pl.folderName || pl.name)
  }
}
