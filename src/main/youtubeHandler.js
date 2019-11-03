import store from '../renderer/store'
import * as sbFetch from './sbFetch'
import customGetters from '../renderer/store/customGetters'
import * as utils from '../MAIN_PROCESS_UTILS'

let ALL_PLAYLISTS = []
let ALL_TRACKS = []

export function youtubizeAll () {
  if (store.state.Events.GLOBAL_LOADING_STATE.value) return console.log('STILL LOADING')
  store.dispatch('globalLoadingState', {value: true, target: 'converting'})
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
  ALL_TRACKS = utils.cloneObject(store.state.CurrentUser.convertedTracks)
  findDuplicatedTracks()

  makeQueries()

  sbFetch.youtubizeAll(ALL_TRACKS)
    .then(CONVERTED_TRACKS => {
      // console.log('REITERAMO::::: ', CONVERTED_TRACKS)
      store.dispatch('youtubizeResult', [...CONVERTED_TRACKS])
    })
    .catch(err => {
      console.error(err) // TODO handle error
    })
    .finally(() => {
      store.dispatch('globalLoadingState', {value: false, target: ''})
    })
}

function findDuplicatedTracks () {
  console.log('DUPLICCC')

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
  console.log('checkin', pls)
  for (let i = 0; i < pls.length; i++) {
    let playlist = pls[i]
    // console.log('loopin', playlist)
    for (let o = 0; o < playlist.tracks.length; o++) {
      let dirtyTrack = playlist.tracks[o]
      let found = false
      for (let u = 0; u < ALL_TRACKS.length; u++) {
        let cleanTrack = ALL_TRACKS[u]
        if (dirtyTrack.id === cleanTrack.id) {
          // Foud duplicated
          found = u
          break
        }
      }

      let plTrackModel = {
        id: playlist.id,
        selected: null
      }
      // Pushing to playlist register if found
      if (found !== false) {
        ALL_TRACKS[found] = {
          ...ALL_TRACKS[found],
          playlists: utils.removeDuplicationId([...ALL_TRACKS[found].playlists, plTrackModel]) // Adding new added playlists to local conversion of track
        }
      } else {
        console.log('new track', dirtyTrack.name, dirtyTrack.id)
        // Create new track entry if not found
        ALL_TRACKS.push({
          id: dirtyTrack.id,
          data: dirtyTrack,
          playlists: [plTrackModel],
          conversion: null,
          custom: null,
          query: null
        })
      }
    }
  }
  // Finished sorting all tracks
  // console.log('Finished', newTracks)
}

function makeQueries () {
  console.log('queries', ALL_TRACKS.length)
  for (let o = 0; o < ALL_TRACKS.length; o++) {
    if (ALL_TRACKS[o].query !== null) continue
    console.log('queries', o)
    let track = ALL_TRACKS[o].data

    let query = `${track.name} ${track.artists[0].name}`
    let duration = track.duration_ms / 1000 / 60
    if (duration > 20) duration = 'long'
    if (duration <= 20 && duration >= 4) duration = 'medium'
    if (duration < 4) duration = 'short'

    ALL_TRACKS[o] = {
      ...ALL_TRACKS[o],
      query: {query, duration, duration_s: track.duration_ms / 1000, id: track.id}
    }
  }
}
