const keytar = require('keytar')

const API = require('./sbFetch')

const GETTERS = require('../Store/Helpers/customGetters').default
const QUERY_MAKER = require('../../queryMaker')
const VUEX_MAIN = require('../Store/mainProcessStore').default
const FSController = require('../FileSystem').default
const ProtocolController = require('./protocol.controller').default

const core = {
  // ---------------- FILESYSTEM ----------------
  setAppStatus: async () => {
    let folders
    try {
      const status = global.CONSTANTS.APP_STATUS
      // Check Homefolders
      folders = status.FOLDERS = await FSController.UserMethods.retrieveFolders()
      if (!folders.paths.length || !folders.selected) return status.IS_LOGGED = false

      await core.setHomeFolder(folders.selected)
      try {
        await core.setSongbasketIdGlobally()
      } catch (error) {
        // TODO ReAuthenticate
        throw error
      }
      return status.IS_LOGGED = true
    } catch (error) {
      if (!folders) throw error
      await FSController.UserMethods.removeFolder(folders.selected)
      core.setAppStatus()
    }
  },
  addHomeFolder: async (path) => {
    try {
      await FSController.UserMethods.addFolder(path)
    } catch (err) {
      throw err
    }
  },
  setHomeFolder: async (path) => {
    try {
      await core.addHomeFolder(path)
      await core.retrieveAndStoreState()
    } catch (err) {
      throw err
    }
  },
  retrieveAndStoreState: async (path = global.HOME_FOLDER) => {
    try {
      const data = await FSController.UserMethods.retrieveState(path)
      VUEX_MAIN.COMMIT.STORE_DATA_FROM_DISK(data)
      // Check if folder has synced playlists to setup watchers
      await FSController.UserMethods.setFolderIcons()
      await FSController.FileWatchers.createPlaylistWatchers()
    } catch (err) {
      throw err
    }
  },
  stateExists: async (path = global.HOME_FOLDER) => {
    try {
      const data = await FSController.UserMethods.retrieveState(path)
      return !!data
    } catch (err) {
      // TODO differetiate between ENOENT and parsing errors, false if enoent throw if error
      return false
    }
  },
  clearUser: async () => {
    if (global.CONSTANTS.CLEAN_CREDS_ON_LOGOUT) await core.removeCredentials()
    global.USER_ID = null
    global.CONSTANTS.APP_STATUS.IS_LOGGED = false
  },
  logout: async () => {
    try {
      await FSController.FileWatchers.clearAll()
      await FSController.UserMethods.unsetCurrentFolder()
      VUEX_MAIN.COMMIT.LOGOUT()
      await core.clearUser()
    } catch (error) {
      throw error
    }
  },
  // -------------
  initializeLogin: async () => {
    return new Promise((resolve, reject) => {
      try {
        if (global.CONSTANTS.LOGIN_WINDOW) return reject(new Error('LOGIN WINDOW EXISTS'))

        const loginWindow = global.CONSTANTS.LOGIN_WINDOW = new global.CONSTANTS.BROWSER_WINDOW(global.CONSTANTS.POPUP_WINDOW_CONFIG)

        loginWindow.loadURL(`${global.CONSTANTS.BACKEND}/init`, { 'extraHeaders': 'pragma: no-cache\n' })
        loginWindow.on('closed', () => {
          global.CONSTANTS.LOGIN_WINDOW = null
          ProtocolController.off('auth', core.onLogin)
          console.log('---Login window closed---')
          global.CONSTANTS.APP_STATUS.IS_LOGGED = true
          resolve()
        })
        ProtocolController.on('auth', core.onLogin)
      } catch (error) {
        reject(error)
      }
    })
  },
  onLogin: async ({payload}) => {
    try {
      if (!(payload && payload.spotify_authorization_success)) throw new Error('AUTHORIZATION FAILED')
      const {user_data} = payload
      await core.setCredentials(user_data.id, user_data.songbasket_id)
      await core.setSongbasketIdGlobally(user_data.id)

      user_data.songbasket_id = null
      core.setUser(user_data)

      await global.CONSTANTS.LOGIN_WINDOW.loadURL(`file://${process.cwd()}/src/renderer/landings/after-login-loading.html`)
      await core.updateAll()
      global.CONSTANTS.LOGIN_WINDOW && await global.CONSTANTS.LOGIN_WINDOW.close()

      console.log('Login successfull')
    } catch (error) {
      throw error
    } finally {
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
      if (!id) throw new Error('CURRENT USER ID MISSING')
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
      if (!id) throw new Error('USER ID DOESN\'T EXIST')
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
  updateAll: async (params = {playlistCompletionCallback: null}) => {
    try {
      await core.updateSelf()
      await core.updatePlaylists(params.playlistCompletionCallback)
    } catch (error) {
      throw error
    }
  },
  updateSelf: async () => {
    try {
      VUEX_MAIN.COMMIT.SET_USER(await API.getMe())
    } catch (error) {
      throw error
    }
  },
  loadMorePlaylists: async () => {
    try {
      const res = await API.getUserPlaylists(global.USER_ID, { offset: GETTERS.playlistsOffset })
      res && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(res, { isLoadMore: true })
    } catch (error) {
      throw error
    }
  },
  updatePlaylists: async completionCb => {
    try {
      const playlists = GETTERS.syncedPlaylistsSnapshots()
      await core.getAndStorePlaylists(playlists, completionCb)
      const res = await API.getUserPlaylists(global.USER_ID)
      res && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(res)
    } catch (error) {
      throw error
    }
  },
  getAndStorePlaylists: async (playlists, completionCb) => {
    return new Promise((resolve, reject) => {
      try {
        if (!playlists.length) return resolve()
        playlists = playlists.map(pl => typeof pl === 'string' ? { id: pl } : pl)
        // for (const pl of playlists) {
        let remaining = playlists.length
        playlists.forEach(async pl => {
          let err = null
          try {
            console.log('playlist', pl)
            const playlist = await API.getPlaylist(pl)
            playlist && VUEX_MAIN.COMMIT.PLAYLIST_STORE_TRACKS(playlist)
          } catch (error) {
            console.error('ERROR WHEN FETCHING PLAYLIST')
            throw error
          } finally {
            completionCb && completionCb(err, pl, playlists)
            !--remaining && resolve()
          }
        })
      } catch (error) {
        return reject(error)
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
    // TODO Rethink this routine
    try {
      await core.populateQueuedPlaylists()
      const queries = []
      try {
        queries.push(...QUERY_MAKER.makeConversionQueries())
      } catch (error) {
        if (error.message === 'NOTHING') console.log('no queries')
        else throw error
      }

      if (queries.length) {
        const pausedPlaylists = GETTERS.pausedPlaylists
        const trackShouldConvert = track => !((track.flags.converted && !track.conversionError) || track.flags.paused || track.playlists.every(({id}) => pausedPlaylists.includes(id)))
        const {tracks, failed} = await API.youtubizeAll(queries, trackShouldConvert, params.trackCompletionCallback)
        VUEX_MAIN.COMMIT.YOUTUBIZE_RESULT(tracks)
        if (failed) throw new Error()
      } else console.log('nothing to do, just committing')
      VUEX_MAIN.COMMIT.COMMIT_ALL_CHANGES()
      console.log('Youtubize done from core')
    } catch (error) {
      console.error(error) // TODO handle error
      throw error
    }
  }
}

export default core
