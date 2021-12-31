import { SpotifyPlaylistId, SpotifyUser } from '../../@types/Spotify'
import { YouTubeResultId } from '../../@types/YouTube'

const makeUrl = (...paths) => paths.join('/')
const PATHS = {
  makeUrl,
  get BASE () {
    return process.env.BACKEND
  },
  USER: (user_id: SpotifyUser['id']) => makeUrl('user', user_id), // back/user/:id
  USER_PLAYLISTS: (user_id: SpotifyUser['id']) => makeUrl(PATHS.USER(user_id), 'playlists'), // back/user/:id/playlists
  PLAYLIST: (playlist_id: SpotifyPlaylistId) => makeUrl('playlists', playlist_id),
  YOUTUBIZE: makeUrl('youtubize'),
  VIDEO: (id: YouTubeResultId) => makeUrl('video', id),
  ME: makeUrl('me')
}

export default PATHS
