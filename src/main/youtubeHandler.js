import store from '../renderer/store'
import * as sbFetch from './sbFetch'

export function youtubizeAll () {
  let syncedPlaylists = store.getters.SyncedPlaylistsWithNewTracks
  console.log('a verga synced playlists', syncedPlaylists)
  let queuedPlaylists = store.getters.QueuedPlaylists
  if (queuedPlaylists.length === 0 && syncedPlaylists.length === 0) return

  let allPlaylists = [...syncedPlaylists, ...queuedPlaylists]

  let pls = []
  for (let i = 0; i < allPlaylists.length; i++) {
    let pl = allPlaylists[i]
    pls = [ ...pls, {id: pl.id, tracks: []} ]

    for (let o = 0; o < pl.tracks.items.length; o++) {
      let track = pl.tracks.items[o]

      let query = `${track.name} ${track.artists[0].name}`
      let duration = track.duration_ms / 1000 / 60
      if (duration > 20) duration = 'long'
      if (duration <= 20 && duration >= 4) duration = 'medium'
      if (duration < 4) duration = 'short'

      pls[i].tracks = [...pls[i].tracks, {query, duration, duration_s: track.duration_ms / 1000, id: track.id}]
    }
  }

  sbFetch.youtubizeAll(pls)
    .then(convertion => {
      console.log('REITERAMO::::: ', convertion)

      store.dispatch('youtubizeResult', convertion)
    })
}
