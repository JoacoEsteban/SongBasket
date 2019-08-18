import store from '../renderer/store'
// import * as sbFetch from './sbFetch'

export function youtubizeAll () {
  let queuedPlaylists = store.getters.QueuedPlaylists

  for (let i = 0; i < queuedPlaylists.length; i++) {
    console.log(queuedPlaylists[i].tracks.items)
  }

  // TODO sbfetch and Backend endpoint
}
