import { SpotifyPlaylist, SpotifyPlaylistId, SpotifyTrack, SpotifyTrackId, SpotifyUser } from './Spotify'
import { TrackConversionResponse, YouTubeResultId } from './YouTube'

export type SongbasketTrack = {
  id: string,
  data: {
    album: SpotifyTrack,
    playlists: ({
      id: SpotifyPlaylistId
    })[],
    conversion: TrackConversionResponse,
    selection: null | false | YouTubeResultId,
    custom: null | YouTubeResultId,
    query: {
      query: string,
      duration: string,
      duration_s: number,
      id: SpotifyTrackId
    },
    flags: {
      converted: boolean,
      conversionError: boolean,
      processed: boolean,
    },
    duration: number,
  }
}

export type SongBasketSaveFile = {
  user: SpotifyUser,
  playlists: SpotifyPlaylist[],
  syncedPlaylists: SpotifyPlaylistId[],
  queuedPlaylists: SpotifyPlaylistId[],
  cachedPlaylists: SpotifyPlaylistId[],
  deletedPlaylists: SpotifyPlaylistId[],
  convertedTracks: SongbasketTrack[],
  currentPlaylist: string,
  control: {
    total: number,
    offset: number
  },
  lastSync: Date
}
