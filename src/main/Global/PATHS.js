const Backend = process.env.BACKEND

const makeUrl = (...paths) => paths.join('/')
const PATHS = {
  makeUrl,
  BASE: Backend,
  USER: user_id => makeUrl('user', user_id), // back/user/:id
  USER_PLAYLISTS: user_id => makeUrl(PATHS.USER(user_id), 'playlists'), // back/user/:id/playlists
  PLAYLIST: playlist_id => makeUrl('playlists', playlist_id),
  ME: makeUrl('me')
}
module.exports = PATHS
