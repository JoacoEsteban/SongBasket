const keytar = require('keytar')

const API = require('./sbFetch')

const GETTERS = require('../Store/Helpers/customGetters').default
const HANDLERS = require('./handlers')
const QUERY_MAKER = require('../../queryMaker')
const VUEX_MAIN = require('../Store/mainProcessStore').default
const core = {
  onLogin: async (details, CB) => {
    const next = () => CB({ requestHeaders: details.requestHeaders })
    try {
      const responseHeaders = (details && details.responseHeaders) || {}

      console.log('authorized', responseHeaders.spotify_authorization_success)
      if (!(responseHeaders.spotify_authorization_success && responseHeaders.spotify_authorization_success[0])) return next()
      global.CONSTANTS.LOGIN_WINDOW.close()

      const user = JSON.parse(details.responseHeaders.user_data[0])
      await core.setCredentials(user.id, user.songbasket_id)
      await core.setSongbasketIdGlobally(user.id)
      user.songbasket_id = null
      core.setUser(user)
      await core.updateAll()
      console.log('data retrieved')

      // TODO test unattachment
      global.CONSTANTS.SESSION.defaultSession.webRequest.onHeadersReceived({urls: [global.CONSTANTS.BACKEND + '/*']}, null)

      HANDLERS.pushToHome()
    } catch (error) {
      throw error
    } finally {
      next()
    }
  },
  setCredentials: async (id, songbasket_id) => {
    try {
      await keytar.setPassword('songbasket', id, songbasket_id)
    } catch (error) {
      throw error
    }
  },
  removeCredentials: async (id = global.USER_ID) => {
    try {
      await keytar.deletePassword('songbasket', id)
    } catch (error) {
      throw error
    }
  },
  getCredentials: async (id = global.USER_ID) => {
    try {
      if (!id) throw new Error('CURRENT USER ID MISSING')
      return await keytar.getPassword('songbasket', id)
    } catch (error) {
      throw error
    }
  },
  setSongbasketIdGlobally: async (id = GETTERS.currentUserId()) => {
    try {
      global.USER_ID = id
      global.SONGBASKET_ID = await core.getCredentials()
      API.createAxiosInstance()
    } catch (error) {
      throw error
    }
  },
  setUser: userData => {
    VUEX_MAIN.COMMIT.SET_USER(userData)
  },
  updateAll: async (params = {
    playlistCompletionCallback: null
  }) => {
    return new Promise((resolve, reject) => {
      let remainingReqs = 2
      const tryResolve = () => !--remainingReqs && (console.log('ALL UPTDATED') + resolve())
      core.updateSelf()
        .then(tryResolve)
        .catch(err => {
          throw err
        })

      core.updatePlaylists(params.playlistCompletionCallback)
        .then(tryResolve)
        .catch(err => {
          throw err
        })
    })
  },
  updateSelf: async () => {
    try {
      VUEX_MAIN.COMMIT.SET_USER(await API.getMe())
    } catch (error) {
      throw error
    }
  },
  updatePlaylists: async completionCb => {
    return new Promise(async (resolve, reject) => {
      const playlists = GETTERS.syncedPlaylistsSnapshots()

      try {
        await core.getAndStorePlaylists(playlists, completionCb)
        resolve()
      } catch (errors) {
        return reject(errors)
      }

      try {
        const playlists = await API.getUserPlaylists(global.USER_ID)
        playlists && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(playlists)
      } catch (error) {
        return reject(error)
      }
      resolve()
    })
  },
  getAndStorePlaylists: (playlists, completionCb) => {
    return new Promise(async (resolve, reject) => {
      let requestsLeft = playlists.length
      if (!requestsLeft) resolve()
      const errors = []
      playlists = playlists.map(pl => typeof pl === 'string' ? { id: pl } : pl)

      for (const pl of playlists) {
        let err = null
        try {
          console.log('playlist', pl)
          const playlist = await API.getPlaylist(pl)
          console.log('Playlist has changes?', playlist ? 'YES' : 'NO')
          playlist && VUEX_MAIN.COMMIT.PLAYLIST_STORE_TRACKS(playlist)
        } catch (error) {
          // TODO handle this
          console.error('ERROR WHEN FETCHING PLAYLIST', error)
          throw error
        } finally {
          completionCb && completionCb(err, pl, playlists)
        }
        !--requestsLeft && (errors.length ? reject(errors) : resolve())
      }
    })
  },
  populateQueuedPlaylists: async () => {
    try {
      const ids = GETTERS.uncachedPlaylists()
      console.log('aber', ids)
      if (ids.length) await core.getAndStorePlaylists(ids)
      else return true
    } catch (error) {
      throw error
    }
  },
  youtubize: async (params = { trackCompletionCallback: null }) => {
    try {
      const empty = await core.populateQueuedPlaylists()
      const queries = []
      try {
        queries.push(...QUERY_MAKER.makeConversionQueries())
      } catch (error) {
        if (error.message === 'NOTHING') return console.log('no queries')
      }
      if (empty && !queries.length) return console.log('nothing to do')
      console.log('query amm', queries.length)
      if (queries.length) VUEX_MAIN.COMMIT.YOUTUBIZE_RESULT(await API.youtubizeAll(queries, params.trackCompletionCallback))
      console.log('Youtubize done from core')
    } catch (error) {
      console.error(error) // TODO handle error
    }
  }
}

export default core
