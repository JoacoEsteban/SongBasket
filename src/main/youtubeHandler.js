// import store from '../renderer/store'
import * as sbFetch from './sbFetch'

export function youtubizeAll () {
  // let queuedPlaylists = store.getters.QueuedPlaylists

  // let pls = []
  // for (let i = 0; i < queuedPlaylists.length; i++) {
  //   let pl = queuedPlaylists[i]
  //   pls = [ ...pls, {id: pl.id, tracks: []} ]

  //   for (let o = 0; o < pl.tracks.items.length; o++) {
  //     let track = pl.tracks.items[o]

  //     let query = `${track.name} ${track.artists[0].name}`
  //     let duration = track.duration_ms / 1000 / 60
  //     if (duration > 20) duration = 'long'
  //     if (duration <= 20 && duration >= 4) duration = 'medium'
  //     if (duration < 4) duration = 'short'

  //     pls[i].tracks = [...pls[i].tracks, {query, duration, id: track.id}]
  //   }
  // }

  sbFetch.youtubizeAll()

  // TODO sbfetch and Backend endpoint
}
