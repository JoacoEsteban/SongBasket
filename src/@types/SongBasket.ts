import { TrackList } from '../main/controllers/FileSystem/FileWatchers'
import { Constants } from './constants'
import { SpotifyPlaylist, SpotifyPlaylistId, SpotifyTrack, SpotifyTrackId, SpotifyUser } from './Spotify'
import { TrackConversionResponse, YouTubeResultId } from './YouTube'

export type SongBasketTrackQuery = {
  query: string,
  duration: 'long' | 'medium' | 'short',
  duration_s: number,
  id: SpotifyTrackId
}


export type SongBasketTrack = {
  id: string,
  data: SpotifyTrack,
  playlists: ({
    id: SpotifyPlaylistId
  })[],
  conversion: TrackConversionResponse | null,
  selection: null | false | YouTubeResultId,
  custom: null | YouTubeResultId,
  query?: SongBasketTrackQuery | null,
  flags: {
    converted: boolean,
    conversionError: boolean,
    processed: boolean,
  },
  duration: number | null,
}

export type SongBasketSaveFile = {
  user: SpotifyUser,
  playlists: SpotifyPlaylist[],
  syncedPlaylists: SpotifyPlaylistId[],
  queuedPlaylists: SpotifyPlaylistId[],
  cachedPlaylists: SpotifyPlaylistId[],
  deletedPlaylists: SpotifyPlaylistId[],
  convertedTracks: SongBasketTrack[],
  currentPlaylist: string,
  control: {
    total: number,
    offset: number
  },
  lastSync: Date
}

export type SongbasketCustomMp3Tags = 'songbasket_spotify_id' | 'songbasket_youtube_id'
export type SongbasketCustomMp3TagsNormalized = 'spotify_id' | 'youtube_id'

export enum SongbasketCustomMp3Tag {
  songbasket_spotify_id = 'songbasket_spotify_id',
  songbasket_youtube_id = 'songbasket_youtube_id',
}

export enum SongbasketCustomMp3TagNormalized {
  spotify_id = 'spotify_id',
  youtube_id = 'youtube_id',
}

export type LoadingController = {
  target: string[]
  count: number
  set: (target: string, value: number) => void
  reflect: (payload: any) => void
  get instance (): { value: boolean, target: string }
  get isLoading (): boolean
  get which (): string
  get canRequest (): boolean
  // -----------------------
  get on (): (target: string) => void
  get off (): (target: string) => void
  ptg (target: string, ptg: number): void
  fn (val: number): (target: string) => void
}


export type AppStatus = {
  APP_STATUS: Constants["APP_STATUS"],
  state: SongBasketSaveFile | null,
  downloadedTracks: TrackList | null,
  FFMPEG_BINS_DOWNLOADED: boolean,
  CONNECTED_TO_INTERNET: boolean,
  CONNECTED_TO_API: boolean,
  error: Error | null
}

export type SongBasketId = string
