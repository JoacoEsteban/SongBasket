import { SongBasketTrack, SongBasketTrackQuery } from '../@types/SongBasket'
import { SpotifyPlaylist } from '../@types/Spotify'
import customGetters from './Store/Helpers/customGetters'

type _Playlist = (SpotifyPlaylist & { synced: boolean })
let ALL_PLAYLISTS: _Playlist[] = []
let ALL_TRACKS: SongBasketTrack[] = []

export function makeConversionQueries (): SongBasketTrack[] {
  let syncedPlaylists: _Playlist[] = customGetters.SyncedPlaylistsSp().map(pl => {
    if (pl.isPaused) return null
    return {
      ...pl,
      synced: true
    }
  }).filter(Boolean) as _Playlist[]
  let queuedPlaylists: _Playlist[] = customGetters.queuedPlaylistsObj().map(pl => {
    return {
      ...pl,
      synced: false
    }
  })
  if (!(queuedPlaylists.length + syncedPlaylists.length)) return []

  ALL_PLAYLISTS = [...syncedPlaylists, ...queuedPlaylists]
  ALL_TRACKS = customGetters.convertedTracks()
  if (!findDuplicatedTracks() && !ALL_TRACKS.some(track => track.flags.conversionError)) throw new Error('NOTHING') // TODO replace error throw with something else

  makeQueries()

  return ALL_TRACKS
}

function findDuplicatedTracks () {
  console.log('DUPLICCC')

  // Accumulating tracks to fetch
  let pls = []
  for (let i = 0; i < ALL_PLAYLISTS.length; i++) {
    const pl = ALL_PLAYLISTS[i]
    const tracks = (pl.tracks)[pl.synced ? 'added' : 'items']
    if (tracks.length === 0) {
      ALL_PLAYLISTS.splice(i--, 1)
      continue
    }
    pls.push({ id: pl.id, tracks })
  }
  // No new tracks
  if (pls.length === 0) return false

  // Computing duplicated tracks
  console.log('checkin', pls)
  for (let i = 0; i < pls.length; i++) {
    const playlist = pls[i]
    // TODO Turn into for...of array.entries()
    for (let o = 0; o < playlist.tracks.length; o++) {
      const dirtyTrack = playlist.tracks[o]
      let found: boolean | number = false
      for (let u = 0; u < ALL_TRACKS.length; u++) {
        let cleanTrack = ALL_TRACKS[u]
        if (dirtyTrack.id === cleanTrack.id) {
          // Foud duplicated
          console.log('found dou')
          found = u
          break
        }
      }

      let plTrackModel = {
        id: playlist.id
      }
      // Pushing to playlist register if found
      if (found !== false) {
        if (!ALL_TRACKS[found].playlists.some(pl => pl.id === plTrackModel.id)) ALL_TRACKS[found].playlists.push(plTrackModel) // Adding new added playlists to local conversion of track
      } else {
        console.log('new track', dirtyTrack.name, dirtyTrack.id)
        // Create new track entry if not found
        ALL_TRACKS.push({
          id: dirtyTrack.id,
          data: dirtyTrack,
          playlists: [plTrackModel],
          conversion: null,
          selection: null,
          custom: null,
          query: null,
          flags: {
            converted: false,
            conversionError: false,
            processed: false,
            paused: false,
            selectionIsApplied: false,
          },
          duration: null
        })
      }
    }
  }
  return true
}

function makeQueries () {
  console.log('queries', ALL_TRACKS.length)
  for (let o = 0; o < ALL_TRACKS.length; o++) {
    if (ALL_TRACKS[o].query) {
      continue
    }
    console.log('queries', o)
    const track = ALL_TRACKS[o].data

    const query = `${track.name} ${track.artists[0].name}`
    let duration: SongBasketTrackQuery['duration'] = ((dur) => {
      if (dur > 20) return 'long'
      if (dur <= 20 && dur >= 4) return 'medium'
      return 'short'
    })(track.duration_ms / 1000 / 60)

    ALL_TRACKS[o].query = { query, duration, duration_s: track.duration_ms / 1000, id: track.id }
  }
}
