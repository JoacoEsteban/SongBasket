import store from '../renderer/store'
import * as sbFetch from './sbFetch'
import customGetters from '../renderer/store/customGetters'

let ALL_PLAYLISTS = []
let NEW_TRACKS = []
let ALL_TRACKS = []

export function youtubizeAll () {
  console.log(' av er', ALL_TRACKS)
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

  ALL_PLAYLISTS = [...syncedPlaylists, ...queuedPlaylists]

  findDuplicatedTracks()

  ALL_TRACKS = store.state.CurrentUser.convertedTracks
  if (ALL_TRACKS.length !== 0) findLocalConversions()
  makeQueries()

  sbFetch.youtubizeAll(NEW_TRACKS)
    .then(CONVERTED_TRACKS => {
      // console.log('REITERAMO::::: ', CONVERTED_TRACKS)
      // TODO adapt this mutation to new implementation
      store.dispatch('youtubizeResult', [...ALL_TRACKS, ...CONVERTED_TRACKS])
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
    // console.log('loopin', playlist)
    let breakLoopAt = sortedTracks.length // Prevents iterating over same-playlist tracks
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
          conversion: null,
          query: null
        })
      }
    }
  }
  // Finished sorting all tracks
  console.log('Finished', sortedTracks)
  NEW_TRACKS = sortedTracks
}

function findLocalConversions () {
  // Find already converted tracks
  for (let i = 0; i < NEW_TRACKS.length; i++) {
    for (let o = 0; o < ALL_TRACKS.length; o++) {
      if (NEW_TRACKS[i].id === ALL_TRACKS[o].id) { // Found ALready converted track
        if (ALL_TRACKS[o].conversion !== null) {
          ALL_TRACKS[o].playlists = [...ALL_TRACKS[o].playlists, ...NEW_TRACKS[i].playlists] // Adding new added playlists to local conversion of track
          NEW_TRACKS.splice(i, 1) // Removed from new tracks
        } else {
          NEW_TRACKS[i].playlists = [...ALL_TRACKS[o].playlists, ...NEW_TRACKS[i].playlists] // This track failed to be fetched in the past, so adding it to the fetch
          ALL_TRACKS.splice(i, 1) // Removed from local tracks, will be saved when retrieved
        }
        break
      }
    }
  }
}

function makeQueries () {
  for (let o = 0; o < NEW_TRACKS.length; o++) {
    let track = NEW_TRACKS[o].data

    let query = `${track.name} ${track.artists[0].name}`
    let duration = track.duration_ms / 1000 / 60
    if (duration > 20) duration = 'long'
    if (duration <= 20 && duration >= 4) duration = 'medium'
    if (duration < 4) duration = 'short'

    NEW_TRACKS[o].query = {query, duration, duration_s: track.duration_ms / 1000, id: track.id}
  }
}
