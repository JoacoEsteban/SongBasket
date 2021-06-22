const makeUrl = (...paths) => paths.join('/')
const PATHS = {
  makeUrl,
  get BASE () {
    return process.env.BACKEND
  },
  USER: user_id => makeUrl('user', user_id), // back/user/:id
  USER_PLAYLISTS: user_id => makeUrl(PATHS.USER(user_id), 'playlists'), // back/user/:id/playlists
  PLAYLIST: playlist_id => makeUrl('playlists', playlist_id),
  YOUTUBIZE: makeUrl('youtubize'),
  VIDEO: id => makeUrl('video', id),
  ME: makeUrl('me')
}
module.exports = PATHS
