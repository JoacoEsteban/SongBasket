import * as keytar from 'keytar'

import * as API from './sbFetch'

import GETTERS from '../../Store/Helpers/customGetters'
import * as QUERY_MAKER from '../../queryMaker'
import VUEX_MAIN from '../../Store/mainProcessStore'
import FSController from '../FileSystem'
import ProtocolController from './protocol.controller'
import { SpotifyPlaylist, SpotifyPlaylistId, SpotifySnapshotId, SpotifyUser } from '../../../@types/Spotify'
import { SongBasketId, SongBasketLoggedUser, SongBasketTrack } from '../../../@types/SongBasket'
import { BrowserWindow } from 'electron'

type PlaylistVersionMap = { id: SpotifyPlaylistId, snapshot_id?: SpotifySnapshotId }
type CompletionCb = (err: Error | null, pl: PlaylistVersionMap, playlists: PlaylistVersionMap[]) => void

const core = {
  // ---------------- FILESYSTEM ----------------
  setAppStatus: async () => {
    let folders
    try {
      const status = global.CONSTANTS.APP_STATUS
      // Check Homefolders
      folders = await FSController.UserMethods.retrieveFolders()
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
      folders.selected && await FSController.UserMethods.removeFolder(folders.selected)
      await core.setAppStatus()
    }
    return false
  },
  addHomeFolder: async (path: string) => {
    await FSController.UserMethods.addFolder(path)
  },
  setHomeFolder: async (path: string) => {
    await core.addHomeFolder(path)
    await core.retrieveAndStoreState()
  },
  retrieveAndStoreState: async (path = global.HOME_FOLDER) => {
    const data = await FSController.UserMethods.retrieveState(path)
    VUEX_MAIN.COMMIT.STORE_DATA_FROM_DISK(data)
    // Check if folder has synced playlists to setup watchers
    await FSController.UserMethods.setFolderIcons()
    await FSController.FileWatchers.createPlaylistWatchers()
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
    await FSController.FileWatchers.clearAll()
    await FSController.UserMethods.unsetCurrentFolder()
    VUEX_MAIN.COMMIT.LOGOUT()
    await core.clearUser()
  },
  // -------------
  initializeLogin: async () => {
    if (global.CONSTANTS.LOGIN_WINDOW) throw new Error('LOGIN WINDOW EXISTS')

    const loginWindow = global.CONSTANTS.LOGIN_WINDOW = new BrowserWindow(global.CONSTANTS.POPUP_WINDOW_CONFIG) // TODO initialize in window.controller

    loginWindow.loadURL(`${global.CONSTANTS.BACKEND}/init`, { 'extraHeaders': 'pragma: no-cache\n' })
    ProtocolController.on('auth', core.onLogin)

    await new Promise<void>((resolve, reject) => {
      loginWindow.on('closed', () => {
        global.CONSTANTS.LOGIN_WINDOW = null
        ProtocolController.off('auth', core.onLogin)
        console.log('---Login window closed---')
        global.CONSTANTS.APP_STATUS.IS_LOGGED && resolve()
      })
    })
  },
  onLogin: async (params: {
    payload: {
      spotify_authorization_success: boolean,
      user_data: SongBasketLoggedUser
    }
  }) => {
    const { payload } = params

    if (!(payload && payload.spotify_authorization_success)) throw new Error('AUTHORIZATION FAILED')
    const { user_data } = payload

    if (!user_data.songbasket_id) throw new Error('NO SONGBASKET_ID')

    await core.setCredentials(user_data.id, user_data.songbasket_id)
    await core.setSongbasketIdGlobally(user_data.id)

    user_data.songbasket_id = null
    core.setUser(user_data)

    // await global.CONSTANTS.LOGIN_WINDOW.loadURL(`file://${process.cwd()}/src/renderer/landings/after-login-loading.html`)
    await core.updateAll()
    global.CONSTANTS.APP_STATUS.IS_LOGGED = true
    global.CONSTANTS.LOGIN_WINDOW && await global.CONSTANTS.LOGIN_WINDOW.close()

    console.log('Login successfull')
  },
  setCredentials: async (id: SpotifyUser['id'], songbasket_id: SongBasketId) => {
    await keytar.setPassword('songbasket', id, songbasket_id)
  },
  removeCredentials: async (id = global.USER_ID) => {
    if (!id) throw new Error('CURRENT USER ID MISSING')
    await keytar.deletePassword('songbasket', id)
  },
  getCredentials: async (id = global.USER_ID) => {
    if (!id) throw new Error('CURRENT USER ID MISSING')
    return await keytar.getPassword('songbasket', id)
  },
  setSongbasketIdGlobally: async (id = GETTERS.currentUserId()) => {
    if (!id) throw new Error('USER ID DOESN\'T EXIST')
    global.USER_ID = id
    global.SONGBASKET_ID = await core.getCredentials()
    API.createAxiosInstance()
  },
  setUser: (userData: SongBasketLoggedUser) => {
    VUEX_MAIN.COMMIT.SET_USER(userData)
  },
  updateAll: async (params: { playlistCompletionCallback: CompletionCb | null } = { playlistCompletionCallback: null }) => {
    await core.updateSelf()
    await core.updatePlaylists(params.playlistCompletionCallback || null)
  },
  updateSelf: async () => {
    VUEX_MAIN.COMMIT.SET_USER(await API.getMe())
  },
  loadMorePlaylists: async () => {
    const res = global.USER_ID && await API.getUserPlaylists(global.USER_ID, { offset: GETTERS.playlistsOffset })
    res && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(res, { isLoadMore: true })
  },
  updatePlaylists: async (completionCb?: CompletionCb | null) => {
    const playlists = GETTERS.syncedPlaylistsSnapshots()
    await core.getAndStorePlaylists(playlists, completionCb || null)
    const res = global.USER_ID && await API.getUserPlaylists(global.USER_ID)
    res && VUEX_MAIN.COMMIT.UPDATE_USER_ENTITIES(res)
  },
  getAndStorePlaylists: async (playlists: PlaylistVersionMap[], completionCb?: CompletionCb | null): Promise<void> => {
    if (!playlists.length) return

    // for (const pl of playlists) {
    playlists.asyncForEachParallel(async pl => {
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
      }
    })
  },
  populateQueuedPlaylists: async () => {
    const ids = GETTERS.uncachedPlaylists()
    console.log('aber', ids)
    if (ids.length) await core.getAndStorePlaylists(ids.map(pl => ({ id: pl })))
    else return true
  },
  youtubize: async (params: { trackCompletionCallback: ((total: number) => void) | null } = { trackCompletionCallback: null }) => {
    // TODO Rethink this routine
    try {
      await core.populateQueuedPlaylists()
      const queries: SongBasketTrack[] = []
      try {
        queries.push(...QUERY_MAKER.makeConversionQueries())
      } catch (error) {
        if (error instanceof Error && error.message === 'NOTHING') console.log('no queries')
        else throw error
      }

      if (queries.length) {
        const pausedPlaylists = GETTERS.pausedPlaylists
        const trackShouldConvert = (track: SongBasketTrack) => !((track.flags.converted && !track.flags.conversionError) || track.flags.paused || track.playlists.every(({ id }) => pausedPlaylists.includes(id)))
        const { tracks, failed } = await API.youtubizeAll(queries, trackShouldConvert, params.trackCompletionCallback)
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
