import store from '../renderer/store'
import * as sbFetch from './sbFetch'

export function youtubizeAll () {
  let syncedPlaylists = store.getters.SyncedPlaylistsSp.map(pl => {
    return {
      ...pl,
      synced: true
    }
  })
  let queuedPlaylists = store.getters.QueuedPlaylists.map(pl => {
    return {
      ...pl,
      synced: false
    }
  })
  if (queuedPlaylists.length === 0 && syncedPlaylists.length === 0) return

  let allPlaylists = [...syncedPlaylists, ...queuedPlaylists]

  let pls = []
  for (let i = 0; i < allPlaylists.length; i++) {
    let pl = allPlaylists[i]
    let tracks = pl.synced ? pl.tracks.added : pl.tracks.items
    if (tracks.length === 0) {
      allPlaylists.splice(i, 1)
      i--
      continue
    }
    pls = [ ...pls, {id: pl.id, tracks: []} ]
    // console.log('a verga Trcks', tracks)

    for (let o = 0; o < tracks.length; o++) {
      let track = tracks[o]

      let query = `${track.name} ${track.artists[0].name}`
      let duration = track.duration_ms / 1000 / 60
      if (duration > 20) duration = 'long'
      if (duration <= 20 && duration >= 4) duration = 'medium'
      if (duration < 4) duration = 'short'

      pls[i].tracks = [...pls[i].tracks, {query, duration, duration_s: track.duration_ms / 1000, id: track.id}]
    }
  }
  if (pls.length === 0) {
    console.log('no new tracks')
    return
  }
  sbFetch.youtubizeAll(pls)
    .then(convertion => {
      console.log('REITERAMO::::: ', convertion)

      store.dispatch('youtubizeResult', convertion)
    })
}
