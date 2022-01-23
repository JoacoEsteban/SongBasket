export type ExternalUrls = {
  spotify: string
}

export type SpotifySnapshotId = string

export type Image = {
  height: number,
  url: string,
  width: number
}

export type PlaylistUser = {
  display_name: string,
  external_urls: ExternalUrls,
  href: string,
  id: string,
  type: string,
  uri: string
}

export type SpotifyUserId = string
export type SpotifyUser = {
  country: string,
  display_name: string,
  email: string,
  explicit_content?: {
    filter_enabled: boolean,
    filter_locked: boolean
  },
  external_urls: ExternalUrls,
  followers: {
    href: string | null,
    total: number
  },
  href: string,
  id: SpotifyUserId,
  images: Image[],
  product: string,
  type: string,
  uri: string
}

export type SpotifyArtist = {
  external_urls: ExternalUrls,
  id: string,
  name: string
}

export type SpotifyTrackId = string
export type SpotifyTrack = {
  album: {
    external_urls: ExternalUrls,
    id: string,
    images: Image[],
    name: string
  },
  artists: SpotifyArtist[],
  duration_ms: number,
  external_urls: ExternalUrls,
  id: SpotifyTrackId,
  name: string,
  preview_url: string,
}

export type SpotifyPlaylistId = string
export type SpotifyPlaylist = {
  collaborative: boolean,
  description: string,
  external_urls: ExternalUrls,
  href: string,
  id: string,
  images: Image[],
  name: string,
  owner: PlaylistUser,
  primary_color: string | null,
  public: boolean,
  snapshot_id: string,
  tracks: {
    href: string,
    total: number,
    items: SpotifyTrack[],
    added: SpotifyTrack[],
    removed: SpotifyTrack[]
  },
  type: 'playlist',
  uri: string,
  isPaused?: boolean,
  folderName?: string | null,
}

// API Responses
export type SpotifyApiPlaylistsResponse = {
  href: string,
  items: SpotifyPlaylist[],
  limit: number,
  next: string,
  offset: number,
  previous: string,
  total: number
}
