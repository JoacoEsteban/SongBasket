import store from '../renderer/store'
import * as sbFetch from './sbFetch'
import customGetters from '../renderer/store/customGetters'

let SYNCED_PLAYLISTS = []
let ALL_PLAYLISTS = []
let SORTED_TRACKS = []

export function youtubizeAll () {
  let syncedPlaylists = customGetters.SyncedPlaylistsSp().map(pl => {
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
  if (queuedPlaylists.length + syncedPlaylists.length === 0) return

  SYNCED_PLAYLISTS = syncedPlaylists
  ALL_PLAYLISTS = [...syncedPlaylists, ...queuedPlaylists]
  if (findDuplicatedTracks() === false) {
    console.log('no new tracks')
    // If no new tracks, just filtering out removed tracks from all playlists
    // If there are tracks to convert, this step will be performed at the end of the 'YOUTUBIZE_RESULT' Mutation
    store.dispatch('clearRemovedTracks')
    return
  }

  findLocalConversions()

  sbFetch.youtubizeAll(makeQueries())
    .then(convertion => {
      console.log('REITERAMO::::: ', convertion)
      // TODO adapt this mutation to new implementation
      // store.dispatch('youtubizeResult', { convertion, sortedTracks: SORTED_TRACKS })
    })
}

function findDuplicatedTracks () {
  // Accumulating tracks to fetch
  let pls = []
  for (let i = 0; i < ALL_PLAYLISTS.length; i++) {
    let pl = ALL_PLAYLISTS[i]
    let tracks = pl.synced ? pl.tracks.added : pl.tracks.items
    if (tracks.length === 0) {
      ALL_PLAYLISTS.splice(i, 1)
      i--
      continue
    }
    pls = [ ...pls, {id: pl.id, tracks} ]
  }
  // No new tracks
  if (pls.length === 0) return false

  // Computing duplicated tracks
  let sortedTracks = []
  for (let i = 0; i < pls.length; i++) {
    let playlist = pls[i]
    console.log('loopin', playlist)
    // Prevents iterating over same-playlist tracks
    let breakLoopAt = sortedTracks.length
    for (let o = 0; o < playlist.tracks.length; o++) {
      let dirtyTrack = playlist.tracks[o]
      let found = false
      for (let u = 0; u < breakLoopAt; u++) {
        let cleanTrack = sortedTracks[u]
        if (dirtyTrack.id === cleanTrack.id) {
          // Foud duplicated
          found = u
          break
        }
      }
      // Pushing to playlist register if found
      if (found !== false) sortedTracks[found].playlists.push(playlist.id)
      else {
        // Create new track entry if not
        sortedTracks.push({
          id: dirtyTrack.id,
          data: dirtyTrack,
          playlists: [playlist.id],
          conversion: null
        })
      }
    }
  }
  // Finished sorting all tracks
  console.log('Finished', sortedTracks)
  SORTED_TRACKS = sortedTracks
}

function findLocalConversions () {
  // Find already converted tracks
  for (let i = 0; i < SORTED_TRACKS.length; i++) {
    let sortedTrack = SORTED_TRACKS[i]
    for (let o = 0; o < SYNCED_PLAYLISTS.length; o++) {
      // Skipping playlist check if new track belongs to it
      if (sortedTrack.playlists.some(pl => pl.id === SYNCED_PLAYLISTS[o].id)) continue

      let tracks = [...SYNCED_PLAYLISTS[o].tracks]
      for (let u = 0; u < tracks.length; u++) {
        let track = tracks[u]
        if (sortedTrack.id === track.id) { // Found duplicate
          SORTED_TRACKS[i].conversion = track
          tracks.splice(u, 1)
        }
      }
    }
  }
}

function makeQueries () {
  let queries = []
  for (let o = 0; o < SORTED_TRACKS.length; o++) {
    // Local version is present, so skip track
    if (SORTED_TRACKS[o].conversion !== null) continue
    let track = SORTED_TRACKS[o].data

    let query = `${track.name} ${track.artists[0].name}`
    let duration = track.duration_ms / 1000 / 60
    if (duration > 20) duration = 'long'
    if (duration <= 20 && duration >= 4) duration = 'medium'
    if (duration < 4) duration = 'short'

    queries = [...queries, {query, duration, duration_s: track.duration_ms / 1000, id: track.id}]
  }
  return queries
}
