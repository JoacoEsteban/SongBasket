const keytar = require('keytar')

const API = require('./sbFetch')
const GLOBAL = require('../../Global/VARIABLES')
const GETTERS = require('../../../renderer/store/customGetters').default
const HANDLERS = require('./handlers')
const { VUEX } = GLOBAL

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
    await VUEX.dispatch('setUser', userData)
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
      VUEX.dispatch('setUserData', await API.getMe())
    } catch (error) {
      throw error
    }
  },
  updatePlaylists: async () => {
    return new Promise((resolve, reject) => {
      const playlists = GETTERS.syncedPlaylistsSnapshots()
      let requestsLeft = 1 + playlists.length // 1 for unsynced playlists
      playlists.forEach(pl => {
        API.getPlaylist(pl)
          .then(playlist => playlist && VUEX.dispatch('playlistStoreTracks', pl))
          .catch(err => {
            console.error(err)
          })
          .finally(() => !--requestsLeft && resolve())
      })

      API.getUserPlaylists(global.USER_ID)
        .then(playlists => {
          if (playlists) VUEX.dispatch('updateUserEntities', playlists)
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => !--requestsLeft && resolve())
    })
  }
}

export default core
