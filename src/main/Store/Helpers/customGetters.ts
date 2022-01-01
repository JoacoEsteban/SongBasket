import { SongBasketSaveFile } from '../../../@types/SongBasket'
import { SpotifyPlaylist, SpotifyPlaylistId, SpotifySnapshotId } from '../../../@types/Spotify'
import VUEX_MAIN from '../mainProcessStore'

const store = {
  get state () {
    return VUEX_MAIN.STATE()
  },
  get safe (): SongBasketSaveFile {
    return VUEX_MAIN.STATE_SAFE() as SongBasketSaveFile
  }
}
export default {
  // Gives spotify object
  get playlistsOffset (): number {
    return store.state.playlists?.filter(pl => !store.state.syncedPlaylists?.some(id => id === pl.id)).length || 0 // Review this
  },
  playlistById (id: SpotifyPlaylistId): SpotifyPlaylist | null {
    return store.safe.playlists.find(pl => pl.id === id) || null
  },
  SyncedPlaylistsSp (): SpotifyPlaylist[] {
    const state = store.state
    let all: SpotifyPlaylist[] = []
    let pls = [...(state.playlists || [])]
    for (let i = 0; i < (state.syncedPlaylists?.length || 0); i++) {
      let syncPl = (state.syncedPlaylists || [])[i]
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
  syncedPlaylistsSnapshots (): { id: SpotifyPlaylistId, snapshot_id: SpotifySnapshotId | undefined }[] {
    const snapshotIdsList = store.state.syncedPlaylists.map(plid => {
      const { id, snapshot_id, isPaused } = store.state.playlists.find(pl => pl.id === plid) || {}

      if (!id || isPaused) return null

      return {
        id, snapshot_id
      }
    })
      .filter(function <T> (x: T | null): x is T {
        return x !== null
      })

    return snapshotIdsList
  },
  giveMePlFolderName (id: SpotifyPlaylistId): string | null {
    const state = store.state
    const pl = state.playlists.find(pl => pl.id === id)
    return pl && (pl.folderName || pl.name) || null // TODO should return only folderName or null
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
    return this.convertedTracks().filter(track => !track.flags.conversionError && (track.conversion?.yt.length || track.custom) && track.playlists.length)// TODO Prevent this filter from ever happening
  },
  anythingToConvert () {

  },
  queuedPlaylistsObj: () => {
    const state = store.state
    return state.queuedPlaylists.map(id => state.playlists.find(pl => pl.id === id))
  }
}
