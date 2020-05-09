const UserMethods = require('../FileSystem/UserMethods').default
const FileWatchers = require('../FileSystem/FileWatchers').default
const trackUtils = require('./Helpers/Tracks').default
const UTILS = require('../../../MAIN_PROCESS_UTILS')
const FSController = {
  UserMethods,
  FileWatchers
}

let saveQueue = 0

const block = false
function SAVE_TO_DISK (check) {
  if (block) return
  if (!check) {
    saveQueue++
    return setTimeout(() => SAVE_TO_DISK(true), 1000)
  }

  if (--saveQueue > 0) return
  console.log('::::::::::::::::::::::::::::SAVING::::::::::::::::::::::::::::::::')
  FSController.UserMethods.saveState({state, path: global.HOME_FOLDER})
}

const getDefaultState = () => {
  return {
    user: {}, // Includes name, number of playlists, image url
    playlists: [],
    syncedPlaylists: [],
    get syncedPlaylists_safe () {
      let aux
      return this.syncedPlaylists.filter(id => (aux = this.playlists.find(pl => pl.id === id)) && !aux.isPaused)
    },
    queuedPlaylists: [],
    cachedPlaylists: [],
    deletedPlaylists: [],
    convertedTracks: [],
    currentPlaylist: '',
    control: {},
    lastSync: null
  }
}

let state = getDefaultState()

const mutations = {
  SET_STATE (newState) {
    state = UTILS.cloneObject(newState)
  },
  STORE_DATA_FROM_DISK (data) {
    const {cachedPlaylists, control, playlists, queuedPlaylists, syncedPlaylists, deletedPlaylists, user, convertedTracks, lastSync} = data

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
    state.lastSync = lastSync

    console.log('DATA STORED. ', playlists.length, 'playlists')

    const initialMutation = false
    if (initialMutation) this.REPROCESS_ALL_TRACKS()
    // this.INVALIDATE_SYNCED_SNAPSHOT_IDS()
    // SAVE_TO_DISK()
  },
  SET_USER (userData) {
    state.user = userData
  },
  UPDATE_USER_ENTITIES (playlists, params = { isLoadMore: false }) {
    function isCachedOrSynced (id) {
      // If it's cached I want to compare the version with the currently stored one.
      // If they match I will keep the tracks (currently stored version)
      // If they don't I will keep the new version without tracks and the playlist will be uncached
      let c = findById(id, state.cachedPlaylists)
      if (c >= 0) c = state.cachedPlaylists[c].snapshot_id
      else c = false

      // I dont care about the version controlling synced ones in here because version control has been handled elsewhere
      let s = findById(id, state.syncedPlaylists) >= 0

      return {c, s}
    }
    function normalizePlaylist (pl) {
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
              this.FIND_AND_UNCACHE(currentPlaylist.id)
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

      for (let i = 0; i < state.syncedPlaylists.length; i++) {
        let pl = state.syncedPlaylists[i]
        let index = findById(pl, playlists.items)
        if (index === -1) {
          state.deletedPlaylists.push(state.playlists[findById(pl, state.playlists)])
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

    if (!params.isLoadMore) state.lastSync = Date.now()
    SAVE_TO_DISK()
  },

  LOGOUT () {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
  },

  PLAYLIST_STORE_TRACKS (playlist) {
    const index = findById(playlist.id, state.playlists)
    // If there are changes with local version, overwrite
    if (index === -1) throw new Error('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')

    const statePl = state.playlists[index]
    // If playlist is synced, then I will compute differences with previous local version
    if (state.syncedPlaylists.some(p => p === playlist.id)) {
      const cbs = []
      let oldName
      if (statePl.name !== playlist.name) {
        oldName = statePl.folderName || statePl.name
        statePl.folderName = null
        cbs.push(() => FSController.FileWatchers.renameFolder({oldName, newName: playlist.folderName})) // Rename Folder
      }

      if ((statePl.images && statePl.images[0] && statePl.images[0].url) !== (playlist.images && playlist.images[0] && playlist.images[0].url)) {
        console.log('new folder image', statePl.name, statePl.images[0].url, playlist.images[0].url)
        cbs.push(() => FSController.UserMethods.setFolderIcons(playlist.id, {force: true}))
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
      const {items, removed, added} = playlistComputeChanges(oldPl, playlist.tracks.items)
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
      const {id, snapshot_id} = playlist
      this.PLAYLIST_UPDATE_CACHED({id, snapshot_id})
      FSController.UserMethods.setFolderIcons(playlist.id, {force: true}) // creates folder and sets icon
    }
    state.playlists[index] = playlist

    SAVE_TO_DISK()
  },

  PLAYLIST_UPDATE_CACHED ({id, snapshot_id}) {
    let found = false
    for (let i = 0; i < state.cachedPlaylists.length; i++) {
      let p = state.cachedPlaylists[i]
      if (p.id === id) {
        p = {id, time: Date.now(), snapshot_id}
        // console.log('UPDATING CACHE LOG FOR PLAYLIST WITH ID ' + id)
        found = true
      }
    }
    if (!found) state.cachedPlaylists = [ ...state.cachedPlaylists, { id, time: Date.now(), snapshot_id } ]
    SAVE_TO_DISK()
  },
  SET_CURRENT_PLAYLIST (id) {
    state.currentPlaylist = id
  },
  QUEUE_PLAYLIST (id) {
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
  FIND_AND_UNQUEUE ({id}) {
    let index = findById(id, state.queuedPlaylists.map(pl => {
      return {id: pl}
    }))
    // console.log('Unqueueing', id, index)
    if (index >= 0) {
      state.queuedPlaylists.splice(index, 1)
    }
  },
  FIND_AND_UNCACHE ({id}) {
    let index = findById(id, state.cachedPlaylists)
    // console.log('Uncaching', id, index)
    if (index >= 0) {
      state.cachedPlaylists.splice(index, 1)
    }
    SAVE_TO_DISK()
  },
  REMOVE_CONVERSION_DUPLICATES () {
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
  CLEAN_TRACKS () {
    const playlists = state.syncedPlaylists.map(id => state.playlists.find(pl => pl.id === id))
    state.convertedTracks = UTILS.cloneObject(state.convertedTracks).filter(track => {
      track.playlists = track.playlists.filter(pl => {
        const playlist = playlists.find(p => p.id === pl.id)
        return (playlist && playlist.tracks.items.some(t => t.id === track.id))
      })
      return track.playlists.length
    })
  },
  REPROCESS_ALL_TRACKS (params = {}) {
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
          conversionError: !convertedTrack.conversion
        }
      }
      return trackUtils.calculateBestMatch(convertedTrack, true)
    }).filter(t => t)
    console.log('all tracks reprocessed')
  },
  async YOUTUBIZE_RESULT (convertedTracks) {
    try {
      state.convertedTracks = convertedTracks.map(convertedTrack => trackUtils.calculateBestMatch(convertedTrack)).filter(t => t)
      ;([...state.queuedPlaylists]).forEach(pl => {
        state.syncedPlaylists.push(pl)
        state.queuedPlaylists = state.queuedPlaylists.filter(p => p !== pl)
        state.cachedPlaylists = state.cachedPlaylists.filter(p => p.id !== pl)
      })
      console.log('Total converted tracks', state.convertedTracks.length)

      state.syncedPlaylists_safe.forEach(async pl => this.COMMIT_TRACK_CHANGES(pl))

      // console.log(state.convertedTracks.some(t => t) && state.convertedTracks.some(t => t.flags))
      // setTimeout(((env) => {
      //   return () => env.dispatch('setConvertedTracksProcessedFlag')
      // })(this), 100)
      SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  INVALIDATE_SYNCED_SNAPSHOT_IDS () {
    state.syncedPlaylists_safe.map(id => state.playlists.find(pl => pl.id === id)).forEach(pl => {
      if (!pl) throw new Error('SYNCED PLAYLIST NOT FOUND IN PLAYLIST LIST')
      pl.snapshot_id = ''
    })
  },
  SET_CONVERTED_TRACKS_PROCESSED_FLAG (val = true) {
    state.convertedTracks.forEach(t => t.flags.processed = val)
  },
  COMMIT_TRACK_CHANGES (id) {
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
  CHANGE_YT_TRACK_SELECTION ({trackId, newId}) {
    try {
      if (newId === undefined) throw new Error('New selection id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')
      if (trackId === undefined) throw new Error('SP Track id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

      const track = state.convertedTracks.find(t => t.id === trackId)
      if (!track) throw new Error('Converted Track not found:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

      track.selection = newId
      track.flags.selectionIsApplied = true

      SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  async UNSYNC_PLAYLIST (id) {
    try {
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
      await SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  async PAUSE_PLAYLIST (id) {
    try {
      console.log('PAUSING ', id)
      if (!state.syncedPlaylists.find(pl => pl && pl === id)) throw new Error('Playlist not found inside SyncedPlaylists list')
      const playlist = state.playlists.find(pl => pl && pl.id === id)
      if (!playlist) throw new Error('Playlists not found inside playlists list')

      playlist.isPaused = !playlist.isPaused

      await SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  async PAUSE_TRACK (id) {
    try {
      if (!id) throw new Error('New selection id does not exist:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

      const track = state.convertedTracks.find(t => t.id === id)
      if (!track) throw new Error('Converted Track not found:: @ mainProcessStore :: CHANGE_YT_TRACK_SELECTION')

      track.flags.paused = !track.flags.paused

      SAVE_TO_DISK()
    } catch (error) {
      throw error
    }
  },
  CUSTOM_TRACK_URL ({details, trackId}) {
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
  STATE_SAFE: filter => {
    let toClone = {}
    if (filter && !Array.isArray(filter)) filter = [filter]

    if (!filter || !filter.length) toClone = controller.STATE()
    else filter.forEach(key => toClone[key] = controller.STATE()[key])

    return UTILS.cloneObject(toClone)
  }
}

function findById (id, obj) {
  for (let i = 0; i < obj.length; i++) {
    let pl = obj[i].id
    if (pl === undefined) pl = obj[i]
    if (pl === id) {
      return i
    }
  }
  return -1
}

function playlistComputeChanges (oldPl, newPl) {
  // Starting with both local spotify copy and local youtube copy
  // Tracks will be compared between both arrays and if it's a match, then both will be spliced from both arrays
  // If there are no changes, then both arrays will be empty

  let added = [ ...newPl ]
  let removed = [ ...oldPl ]
  let items = [] // Tracks that are preserved between versions

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
  return {added, items, removed}
}

export default controller
