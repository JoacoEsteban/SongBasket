import { TrackList } from '../main/controllers/FileSystem/FileWatchers'
import { Constants } from './constants'
import { SpotifyPlaylist, SpotifyPlaylistId, SpotifySnapshotId, SpotifyTrack, SpotifyTrackId, SpotifyUser } from './Spotify'
import { TrackConversionResponse, YouTubeResult, YouTubeResultId } from './YouTube'

export type SongBasketTrackQuery = {
  query: string,
  duration: 'long' | 'medium' | 'short',
  duration_s: number,
  id: SpotifyTrackId
}

export type SongBasketId = string

export type SongBasketLoggedUser = SpotifyUser & {
  songbasket_id: SongBasketId | null
}

export type SongBasketTrackConversionSelection = null | false | YouTubeResultId

export type SongBasketTrack = {
  id: string,
  data: SpotifyTrack,
  playlists: ({
    id: SpotifyPlaylistId
  })[],
  conversion: TrackConversionResponse | null,
  selection: SongBasketTrackConversionSelection,
  custom: null | YouTubeResult,
  query?: SongBasketTrackQuery | null,
  flags: {
    converted: boolean,
    conversionError: boolean,
    processed: boolean,
    paused: boolean,
    selectionIsApplied: boolean,
  },
  duration: number | null,
}

export type SongBasketCachedPlaylistEntry = {
  id: SpotifyPlaylistId,
  time: number,
  snapshot_id: SpotifySnapshotId
}

export type SongBasketSaveFile = {
  user: SongBasketLoggedUser,
  playlists: SpotifyPlaylist[],
  syncedPlaylists: SpotifyPlaylistId[],
  queuedPlaylists: SpotifyPlaylistId[],
  cachedPlaylists: SongBasketCachedPlaylistEntry[],
  deletedPlaylists: SpotifyPlaylist[],
  convertedTracks: SongBasketTrack[],
  currentPlaylist: SpotifyPlaylistId | null,
  control: {
    total: number,
    offset: number
  },
  lastSync: Date | null
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

export type SongbasketFoldersFile = {
  paths: string[],
  selected: string | null
}

export type SongBasketTrackFile = {
  playlist: SpotifyPlaylistId,
  path: string,
  file: string,
} & {
    [key in SongbasketCustomMp3Tags]?: string
  }
