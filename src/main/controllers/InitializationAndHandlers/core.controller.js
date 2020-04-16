const keytar = require('keytar')

const API = require('./sbFetch')
const GLOBAL = require('../../Global/VARIABLES')
const GETTERS = require('../Store/Helpers/customGetters').default
const HANDLERS = require('./handlers')
const QUERY_MAKER = require('../../queryMaker')
const VUEX_MAIN = require('../Store/mainProcessStore').default
console.log(VUEX_MAIN)
const core = {
  onLogin: async (details, CB) => {
    const next = () => CB({ requestHeaders: details.requestHeaders })
    try {
      const responseHeaders = (details && details.responseHeaders) || {}

      if (!(responseHeaders.spotify_authorization_success && responseHeaders.spotify_authorization_success[0])) return next()

      GLOBAL.LOGIN_WINDOW.close()

      const user = JSON.parse(details.responseHeaders.user_data[0])
      await core.setCredentials(user.id, user.songbasket_id)
      await core.setSongbasketIdGlobally(user.id)
      user.songbasket_id = null
      await core.setUser(user)
      await core.updateAll()

      // TODO test unattachment
      GLOBAL.SESSION.defaultSession.webRequest.onHeadersReceived({urls: [GLOBAL.BACKEND + '/*']}, null)

      HANDLERS.pushToHome()
      next()
    } catch (error) {
      next()
      throw error
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
  setUser: async userData => {
    await VUEX_MAIN.COMMIT.SET_USER(userData)
  },
  updateAll: async () => {
    return new Promise((resolve, reject) => {
      let remainingReqs = 2
      core.updateSelf()
        .then()
        .catch(err => console.error(err))
        .finally(() => !--remainingReqs && resolve())

      core.updatePlaylists()
        .then()
        .catch(err => console.error(err))
        .finally(() => !--remainingReqs && resolve())
    })
  },
  updateSelf: async () => {
    try {
      VUEX_MAIN.COMMIT.SET_USER(await API.getMe())
    } catch (error) {
      throw error
    }
  },
  getAndStorePlaylists: playlists => {
    return new Promise(async (resolve, reject) => {
      let requestsLeft = playlists.length
      if (!requestsLeft) resolve()
      playlists = playlists.map(pl => typeof pl === 'string' ? { id: pl } : pl)
      await playlists.forEach(async pl => {
        try {
          console.log('playlist', pl)
          const playlist = await API.getPlaylist(pl)
          console.log('Playlist has changes?', playlist ? 'YES' : 'NO')
          playlist && await VUEX_MAIN.COMMIT.PLAYLIST_STORE_TRACKS(playlist)
          !--requestsLeft && resolve()
        } catch (error) {
          // TODO handle this
          console.error('ERROR WHEN FETCHING PLAYLIST', error)
        }
      })
    })
  },
  updatePlaylists: async () => {
    return new Promise(async (resolve, reject) => {
      const playlists = GETTERS.syncedPlaylistsSnapshots()
      let requestsLeft = 2

      try {
        await core.getAndStorePlaylists(playlists)
        !--requestsLeft && resolve()
      } catch (error) {
        return reject(error)
      }

      try {
        const playlists = await API.getUserPlaylists(global.USER_ID)
        playlists && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(playlists)
        !--requestsLeft && resolve()
      } catch (error) {
        return reject(error)
      }
    })
  },
  populateQueuedPlaylists: async () => {
    try {
      const ids = GETTERS.uncachedPlaylists()
      console.log('aber', ids)
      await core.getAndStorePlaylists(ids)
    } catch (error) {
      throw error
    }
  },
  youtubize: async () => {
    try {
      await core.populateQueuedPlaylists()
      const queries = QUERY_MAKER.makeConversionQueries()
      await VUEX_MAIN.COMMIT.YOUTUBIZE_RESULT(await API.youtubizeAll(queries))
      console.log('done from core')
    } catch (error) {
      console.error(error) // TODO handle error
    }
  }
}

export default core
