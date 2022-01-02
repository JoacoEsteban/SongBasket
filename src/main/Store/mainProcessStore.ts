import UserMethods from '../controllers/FileSystem/UserMethods'
import FileWatchers from '../controllers/FileSystem/FileWatchers'
import trackUtils from './Helpers/Tracks'
import * as UTILS from '../../MAIN_PROCESS_UTILS'
import { SongBasketCachedPlaylistEntry, SongBasketSaveFile, SongBasketTrack, SongBasketTrackConversionSelection } from '../../@types/SongBasket'
import { SpotifyApiPlaylistsResponse, SpotifyPlaylist, SpotifyPlaylistId, SpotifySnapshotId, SpotifyTrack, SpotifyTrackId, SpotifyUser } from '../../@types/Spotify'
import { YouTubeResult, YouTubeResultId } from '../../@types/YouTube'
const FSController = {
  UserMethods,
  FileWatchers
}

let saveQueue = 0

const block = false
function SAVE_TO_DISK (check: boolean = false): void {
  if (block) return
  if (!check) {
    saveQueue++
    setTimeout(() => SAVE_TO_DISK(true), 1000)
    return
  }

  if (--saveQueue > 0) return
  console.log('::::::::::::::::::::::::::::SAVING::::::::::::::::::::::::::::::::')
  FSController.UserMethods.saveState({ state, path: global.HOME_FOLDER })
}

const getDefaultState: () => SongBasketSaveFile = () => {
  return {
    user: {
      country: '',
      songbasket_id: null,
      display_name: '',
      email: '',
      external_urls: {
        spotify: ''
      },
      followers: {
        href: null,
        total: 0
      },
      href: '',
      id: '',
      images: [],
      product: '',
      type: '',
      uri: ''
    },
    playlists: [],
    syncedPlaylists: [],
    queuedPlaylists: [],
    cachedPlaylists: [],
    deletedPlaylists: [],
    convertedTracks: [],
    currentPlaylist: '',
    control: {
      total: 0,
      offset: 0
    },
    lastSync: null
  }
}

const getters = {
  get syncedPlaylists_safe (): SpotifyPlaylistId[] {
    let aux
    return state.syncedPlaylists.filter(id => (aux = state.playlists.find(pl => pl.id === id)) && !aux.isPaused)
  }
}

let state = getDefaultState()

const mutations = {
  SET_STATE (newState: SongBasketSaveFile): void {
    state = UTILS.cloneObject(newState)
  },
  STORE_DATA_FROM_DISK (data: SongBasketSaveFile): void {
    const { cachedPlaylists, control, playlists, queuedPlaylists, syncedPlaylists, deletedPlaylists, user, convertedTracks, lastSync } = data

    state.playlists = playlists
    state.user = user
    state.cachedPlaylists = cachedPlaylists
    state.control = control
    state.playlists = playlists
    state.queuedPlaylists = queuedPlaylists
    state.syncedPlaylists = syncedPlaylists
    state.deletedPlaylists = deletedPlaylists
    state.user = user
    state.convertedTracks = convertedTracks
    state.lastSync = lastSync && new Date(lastSync) || null

    console.log('DATA STORED. ', playlists.length, 'playlists')

    const initialMutation = false
    if (initialMutation) this.REPROCESS_ALL_TRACKS()
    // this.INVALIDATE_SYNCED_SNAPSHOT_IDS()
    // SAVE_TO_DISK()
  },
  SET_USER (userData: SpotifyUser): void {
    state.user = userData
  },
  UPDATE_USER_ENTITIES (playlists: SpotifyApiPlaylistsResponse, params = { isLoadMore: false }) {
    function isCachedOrSynced (id: SpotifyPlaylistId): { c: SpotifySnapshotId | boolean, s: boolean } {
      // If it's cached I want to compare the version with the currently stored one.
      // If they match I will keep the tracks (currently stored version)
      // If they don't I will keep the new version without tracks and the playlist will be uncached
      let c = ((cacheEntry) => {
        if (cacheEntry >= 0) return state.cachedPlaylists[cacheEntry].snapshot_id
        return false
      })(findById(id, state.cachedPlaylists))

      // I dont care about the version controlling synced ones in here because version control has been handled elsewhere
      let s = findById(id, state.syncedPlaylists) >= 0

      return { c, s }
    }
    function normalizePlaylist (pl: SpotifyPlaylist): SpotifyPlaylist {
      pl.tracks.items = []
      pl.tracks.added = []
      pl.tracks.removed = []
      return pl
    }

    if (!params.isLoadMore) {
      if (state.cachedPlaylists.length > 0 || state.syncedPlaylists.length > 0) {
        for (let i = 0; i < playlists.items.length; i++) {
          let currentPlaylist = playlists.items[i]
          let cachedOrSynced = isCachedOrSynced(currentPlaylist.id)
          if (!cachedOrSynced.c && !cachedOrSynced.s) {
            normalizePlaylist(playlists.items[i])
          }

          if (cachedOrSynced.c !== false) {
            // console.log('IS CACHED::')
            if (cachedOrSynced.c === currentPlaylist.snapshot_id) {
              playlists.items.splice(i, 1, state.playlists[findById(currentPlaylist.id, state.playlists)])
            } else {
              this.FIND_AND_UNCACHE({ id: currentPlaylist.id })
            }
            continue
          }
          if (cachedOrSynced.s) {
            // If playlist is synced, it will have already been processed, so im just replacing it
            let index = findById(currentPlaylist.id, state.playlists)
            playlists.items.splice(i, 1, state.playlists[index])
            continue
          }
        }
      } else {
        // console.log('NO CACHED OR SYNCED PLS')
        playlists.items.forEach(normalizePlaylist)
      }

      // FIXME deprecate or rethink this logic
      // TODO this doesnt truly reflect if a playlist has been deleted, the request might have a limit to the number of playlists returned,
      // TODO so if the playlist is not in the response it is assumed to have been deleted wrongly
      // TODO if there's need to implement this logic, it should also unlink the playlist from every track in convertedTracks which contains the playlist
      for (let i = 0; i < state.syncedPlaylists.length; i++) {
        let pl = state.syncedPlaylists[i]
        let index = findById(pl, playlists.items)
        if (index === -1) {
          const deletedPlaylist = state.playlists[findById(pl, state.playlists)]
          state.deletedPlaylists.push(deletedPlaylist)
          state.syncedPlaylists.splice(i--, 1)
        }
      }

      state.playlists = playlists.items
    } else {
      playlists.items.forEach(pl => state.playlists.every(local => local.id !== pl.id) && state.playlists.push(normalizePlaylist(pl)))
    }

    state.control = {
      total: playlists.total,
      offset: state.playlists.length
    }

    if (!params.isLoadMore) state.lastSync = new Date()
    SAVE_TO_DISK()
  },

  LOGOUT () {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
  },

  PLAYLIST_STORE_TRACKS (playlist: SpotifyPlaylist): void {
    const index = findById(playlist.id, state.playlists)
    // If there are changes with local version, overwrite
    if (index === -1) throw new Error('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')

    const statePl = state.playlists[index]
    // If playlist is synced, then I will compute differences with previous local version
    if (state.syncedPlaylists.some(p => p === playlist.id)) {
      const cbs = []
      if (statePl.name !== playlist.name) {
        const oldName: string = statePl.folderName || statePl.name
        statePl.folderName = null
        cbs.push(() => playlist.folderName && FSController.UserMethods.renameFolder({ oldName, newName: playlist.folderName })) // Rename Folder
      }

      if ((statePl.images && statePl.images[0] && statePl.images[0].url) !== (playlist.images && playlist.images[0] && playlist.images[0].url)) {
        console.log('new folder image', statePl.name, statePl.images[0].url, playlist.images[0].url)
        cbs.push(() => FSController.UserMethods.setFolderIcons(playlist.id, { force: true }))
      }

      playlist.folderName = statePl.folderName || (() => {
        let name = playlist.name
        if (state.playlists.some(p => p.name === playlist.name && p.id !== playlist.id)) name += ' - ' + playlist.id
        return name
      })()
      cbs.forEach(cb => cb())

      const oldPl = [
        ...statePl.tracks.items,
        ...statePl.tracks.removed
      ]
      // Compute track changes
      // Using just removed and items. Im not using added because they will pop up in the new data.
      const { items, removed, added } = playlistComputeChanges(oldPl, playlist.tracks.items)
      // console.log('CHANGES', items.map(i => i.name), added.map(i => i.name), removed.map(i => i.name))
      playlist.tracks.items = items
      playlist.tracks.added = added
      playlist.tracks.removed = removed
      console.log('CHANGES', playlist.tracks.added.map(i => i.name), playlist.tracks.removed.map(i => i.name))
    } else {
      // Playlist was not synced before so I dont care about computing changes
      playlist.tracks = {
        ...playlist.tracks,
        added: [],
        removed: []
      }
      const { id, snapshot_id } = playlist
      this.PLAYLIST_UPDATE_CACHED({ id, snapshot_id })
      FSController.UserMethods.setFolderIcons(playlist.id, { force: true }) // creates folder and sets icon
    }
    state.playlists[index] = playlist

    SAVE_TO_DISK()
  },

  PLAYLIST_UPDATE_CACHED (params: { id: SpotifyPlaylistId, snapshot_id: SpotifySnapshotId }): void {
    const { id, snapshot_id } = params
    let found = false
    for (let i = 0; i < state.cachedPlaylists.length; i++) {
      let p = state.cachedPlaylists[i]
      if (p.id === id) {
        p = { id, time: Date.now(), snapshot_id }
        // console.log('UPDATING CACHE LOG FOR PLAYLIST WITH ID ' + id)
        found = true
      }
    }
    if (!found) state.cachedPlaylists = [...state.cachedPlaylists, { id, time: Date.now(), snapshot_id }]
    SAVE_TO_DISK()
  },
  SET_CURRENT_PLAYLIST (id: SpotifyPlaylistId): void {
    state.currentPlaylist = id
  },
  QUEUE_PLAYLIST (id: SpotifyPlaylistId): void {
    let found = false
    for (let i = 0; i < state.queuedPlaylists.length; i++) {
      let pl = state.queuedPlaylists[i]
      if (pl === id) { // Unqueues if found
        found = true
        state.queuedPlaylists.splice(i, 1)
      }
    }
    if (!found) state.queuedPlaylists = [...state.queuedPlaylists, id]
  },
  FIND_AND_UNQUEUE (params: { id: SpotifyPlaylistId }): void {
    const { id } = params
    let index = findById(id, state.queuedPlaylists.map(pl => {
      return { id: pl }
    }))
    // console.log('Unqueueing', id, index)
    if (index >= 0) {
      state.queuedPlaylists.splice(index, 1)
    }
  },
  FIND_AND_UNCACHE (params: { id: SpotifyPlaylistId }): void {
    const { id } = params
    let index = findById(id, state.cachedPlaylists)
    // console.log('Uncaching', id, index)
    if (index >= 0) {
      state.cachedPlaylists.splice(index, 1)
    }
    SAVE_TO_DISK()
  },
  REMOVE_CONVERSION_DUPLICATES (): void {
    let cloned = [...state.convertedTracks]
    console.log(cloned[0].id)

    for (const key in cloned) {
      const itm1 = cloned[key]
      for (const key2 in cloned) {
        const itm2 = cloned[key2]
        if (itm1 === itm2) continue
        if (itm1.id === itm2.id) {
          cloned.splice(parseInt(key), 1)
          break
        }
      }
    }

    // cloned = cloned.filter((a, index1) => { // Removes dupes
    //   return !cloned.some((b, index2) => {
    //     if (a.id === b.id && index1 !== index2) {
    //       console.log(a.data, b.data)
    //       return true
    //     }
    //   })
    // })
    console.log(cloned)
    state.convertedTracks = cloned
  },
  CLEAN_TRACKS (): void {
    const playlists = state.syncedPlaylists.map(id => state.playlists.find(pl => pl.id === id))
    state.convertedTracks = UTILS.cloneObject(state.convertedTracks).filter(track => {
      track.playlists = track.playlists.filter(pl => {
        const playlist = playlists.find(p => p && p.id === pl.id)
        return (playlist && playlist.tracks.items.some(t => t.id === track.id))
      })
      return track.playlists.length
    })
  },
  REPROCESS_ALL_TRACKS (params: { resetSelection: boolean, forceCustom: boolean } = { resetSelection: false, forceCustom: false }): void {
    state.convertedTracks = state.convertedTracks.map(convertedTrack => {
      if (params.resetSelection) convertedTrack.selection = null
      if (convertedTrack.custom) {
        convertedTrack.custom.isCustomTrack = true
        if (params.forceCustom) convertedTrack.selection = false
        if (!convertedTrack.custom.youtube_id) convertedTrack.custom.youtube_id = convertedTrack.custom.id
      }
      if (convertedTrack.conversion) convertedTrack.conversion.yt.forEach(t => {
        if (!t.youtube_id) t.youtube_id = t.id
      })
      if (!convertedTrack.flags) {
        convertedTrack.flags = {
          converted: !!convertedTrack.conversion,
          conversionError: !convertedTrack.conversion,
          processed: false,
          paused: false,
          selectionIsApplied: false,
        }
      }
      return trackUtils.calculateBestMatch(convertedTrack, true)
    }).filter(t => t)
    console.log('all tracks reprocessed')
  },
  async YOUTUBIZE_RESULT (convertedTracks: SongBasketTrack[]): Promise<void> {
    try {
      state.convertedTracks = convertedTracks.map(convertedTrack => trackUtils.calculateBestMatch(convertedTrack)).filter(t => t);
      ([...state.queuedPlaylists]).forEach(pl => {
        state.syncedPlaylists.push(pl)
        state.queuedPlaylists = state.queuedPlaylists.filter(p => p !== pl)
        state.cachedPlaylists = state.cachedPlaylists.filter(p => p.id !== pl)
      })
      console.log('Total converted tracks', state.convertedTracks.length)

      // console.log(state.convertedTracks.some(t => t) && state.convertedTracks.some(t => t.flags))
      // setTimeout(((env) => {
      //   return () => env.dispatch('setConvertedTracksProcessedFlag')
      // })(this), 100)
      SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  COMMIT_ALL_CHANGES (): void {
    getters.syncedPlaylists_safe.forEach(pl => this.COMMIT_TRACK_CHANGES(pl))
    SAVE_TO_DISK()
  },
  INVALIDATE_SYNCED_SNAPSHOT_IDS (): void {
    getters.syncedPlaylists_safe.map(id => state.playlists.find(pl => pl.id === id)).forEach(pl => {
      if (!pl) throw new Error('SYNCED PLAYLIST NOT FOUND IN PLAYLIST LIST')
      pl.snapshot_id = ''
    })
  },
  SET_CONVERTED_TRACKS_PROCESSED_FLAG (val: boolean = true): void {
    state.convertedTracks.forEach(t => t.flags.processed = val)
  },
  COMMIT_TRACK_CHANGES (id: SpotifyPlaylistId): void {
    let index = findById(id, state.playlists)
    if (index === -1) {
      console.error('PLAYLIST NOT FOUND WHEN COMMITING CHANGES')
      return
    }
    let tracks = state.playlists[index].tracks

    // Remove playlist from converted tracks registries
    if (tracks.removed && tracks.removed.length) {
      tracks.removed.forEach(rem => {
        for (let o = 0; o < state.convertedTracks.length; o++) {
          const track = state.convertedTracks[o]
          if (rem.id === track.id) {
            track.playlists = track.playlists.filter(pl => pl.id !== id)
            if (!track.playlists.length) state.convertedTracks.splice(o, 1) // Track not being used by any playlist. Removing track
            break
          }
        }
      })
    } else if (!tracks.added || !tracks.added.length) return

    state.playlists[index].tracks.items.push(...(tracks.added || []))
    state.playlists[index].tracks.added = []
    state.playlists[index].tracks.removed = []
  },
  CHANGE_YT_TRACK_SELECTION (params: { trackId: SpotifyTrackId, newId: SongBasketTrackConversionSelection }) {
    const { trackId, newId } = params
    if (newId === undefined) throw new Error('New selection id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')
    if (!trackId) throw new Error('SP Track id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

    const track = state.convertedTracks.find(t => t.id === trackId)
    if (!track) throw new Error('Converted Track not found:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')
    if (!track.conversion?.yt.length && newId !== false) throw new Error('NO CONVERSION RESULTS TO CHANGE')

    track.selection = newId
    track.flags.selectionIsApplied = newId !== null

    SAVE_TO_DISK()
  },
  async UNSYNC_PLAYLIST (id: SpotifyPlaylistId): Promise<void> {
    console.log('UNSYNCING ', id)
    if (!state.syncedPlaylists.find(pl => pl && pl === id)) throw new Error('Playlist not found inside SyncedPlaylists list')
    state.syncedPlaylists = state.syncedPlaylists.filter(pl => pl && pl !== id)
    const playlist = state.playlists.find(pl => pl && pl.id === id)
    if (!playlist) throw new Error('Playlists not found inside playlists list')

    playlist.tracks.removed = playlist.tracks.items
    playlist.tracks.items = []
    playlist.tracks.added = []

    this.COMMIT_TRACK_CHANGES(id)

    await FSController.UserMethods.deletePlaylist(playlist.folderName || playlist.name)
    SAVE_TO_DISK()
  },
  PAUSE_PLAYLIST (id: SpotifyPlaylistId): void {
    console.log('PAUSING ', id)
    if (!state.syncedPlaylists.find(pl => pl && pl === id)) throw new Error('Playlist not found inside SyncedPlaylists list')
    const playlist = state.playlists.find(pl => pl && pl.id === id)
    if (!playlist) throw new Error('Playlists not found inside playlists list')

    playlist.isPaused = !playlist.isPaused

    SAVE_TO_DISK()
  },
  PAUSE_TRACK (id: SpotifyTrackId): void {
    if (!id) throw new Error('New selection id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

    const track = state.convertedTracks.find(t => t.id === id)
    if (!track) throw new Error('Converted Track not found:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

    track.flags.paused = !track.flags.paused

    SAVE_TO_DISK()
  },
  CUSTOM_TRACK_URL (params: { details: YouTubeResult, trackId: SpotifyTrackId }): void {
    const { details, trackId } = params
    const track = state.convertedTracks[findById(trackId, state.convertedTracks)]
    if (!track) return console.error('TRACK NOT FOUND IN CONVERTED TRACKS :: CUSTOM_TRACK_URL')

    details.isCustomTrack = true
    track.custom = details
    track.selection = false
    SAVE_TO_DISK()
  }
}

const controller = {
  COMMIT: mutations,
  STATE: () => state,
  STATE_SAFE: (filter?: (keyof SongBasketSaveFile)[]): SongBasketSaveFile | Partial<SongBasketSaveFile> => {
    const _state = UTILS.cloneObject(controller.STATE())

    filter?.length && (Object.keys(_state) as Array<keyof SongBasketSaveFile>)
      .filter(k => !filter.includes(k))
      .forEach((key) => {
        delete _state[key]
      })

    return _state
  }
}

function findById (id: string, obj: (string | { id: string })[]): number {
  for (let i = 0; i < obj.length; i++) {
    const _obj = obj[i]
    let pl = (typeof _obj !== 'string' && _obj.id) || _obj
    if (pl === id) {
      return i
    }
  }
  return -1
}

function playlistComputeChanges (oldPlaylistTracks: SpotifyTrack[], newPlaylistTracks: SpotifyTrack[]): { added: SpotifyTrack[], items: SpotifyTrack[], removed: SpotifyTrack[] } {
  // Starting with both local spotify copy and local youtube copy
  // Tracks will be compared between both arrays and if it's a match, then both will be spliced from both arrays
  // If there are no changes, then both arrays will be empty

  let added = [...newPlaylistTracks]
  let removed = [...oldPlaylistTracks]
  let items: SpotifyTrack[] = [] // Tracks that are preserved between versions

  if (removed.length > 0) { // This checks if the synced playlist has not been added to DB yet, if so, then every song will be 'new'
    let i = 0
    while (i < added.length) {
      let a = added[i]
      let found = false

      for (let o = 0; o < removed.length; o++) {
        let r = removed[o]

        if (a.id === r.id) {
          // No changes to track
          found = true
          removed.splice(o, 1)
          // Preserved track is stored
          items = [...items, ...added.splice(i, 1)]
          break
        }
      }
      if (!found) i++
    }
  } else removed = []
  return { added, items, removed }
}

export default controller
