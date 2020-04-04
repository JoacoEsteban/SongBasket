/* eslint-disable camelcase */
import Vue from 'vue'
import FSController from '../../../main/controllers/FileSystem/index'
import trackUtils from '../Helpers/Tracks'

// import SharedStates from './SharedStates'
// Last time changes were saved to disk
let saveQueue = 0

function SAVE_TO_DISK (check) {
  if (!check) {
    saveQueue++
    return setTimeout(() => SAVE_TO_DISK(true), 1000)
  }

  if (--saveQueue > 0) return
  console.log('::::::::::::::::::::::::::::SAVING::::::::::::::::::::::::::::::::')
  FSController.UserMethods.saveState({state, path: global.HOME_FOLDER})
}

function LOADING (store, value, target) {
  if (!value) value = false
  store.dispatch('globalLoadingState', {value, target}, {root: true})
}

const getDefaultState = () => {
  return {
    user: {}, // Includes name, number of playlists, image url
    playlists: [],
    syncedPlaylists: [],
    queuedPlaylists: [],
    cachedPlaylists: [],
    deletedPlaylists: [],
    convertedTracks: [],
    currentPlaylist: '',
    control: {},
    lastSync: null
  }
}

const state = getDefaultState()

const actions = {
  storeDataFromDisk ({commit}, data) {
    return new Promise((resolve, reject) => {
      commit('STORE_DATA_FROM_DISK', data)
      resolve()
    })
  },
  saveToDisk () {
    SAVE_TO_DISK()
  },
  updateUserEntities ({ commit }, object) {
    commit('UPDATE_USER_ENTITIES', object)
  },
  updatePlaylists ({ commit }, playlists) {
    commit('UPDATE_PLAYLISTS', playlists)
  },
  logout ({ commit }) {
    commit('LOGOUT')
  },
  playlistStoreTracks ({ commit }, playlist) {
    return new Promise((resolve, reject) => {
      commit('PLAYLIST_STORE_TRACKS', playlist)
      resolve()
    })
  },
  playlistUpdateCached ({ commit }, {id, snapshot_id}) {
    commit('PLAYLIST_UPDATE_CACHED', {id, snapshot_id})
  },
  setCurrentPlaylist ({ commit }, id) {
    commit('SET_CURRENT_PLAYLIST', id)
    this.dispatch('currentPlaylistSet', {}, {root: true})
  },
  queuePlaylist ({ commit }, id) {
    return new Promise((resolve, reject) => {
      commit('QUEUE_PLAYLIST', id)
      resolve()
    })
  },
  findAndUnqueue ({ commit, getters }, id) {
    return new Promise((resolve, reject) => {
      commit('FIND_AND_UNQUEUE', {id, getters})
      resolve()
    })
  },
  findAndUncache ({ commit, getters }, id) {
    return new Promise((resolve, reject) => {
      commit('FIND_AND_UNCACHE', {id, getters})
      resolve()
    })
  },
  removeConversionDuplicates ({ commit }) {
    return new Promise((resolve, reject) => {
      commit('REMOVE_CONVERSION_DUPLICATES')
      resolve()
    })
  },
  cleanTracks ({ commit }) {
    return new Promise((resolve, reject) => {
      commit('CLEAN_TRACKS')
      resolve()
    })
  },
  reprocessAllTracks ({ commit }, params) {
    return new Promise((resolve, reject) => {
      commit('REPROCESS_ALL_TRACKS', params)
      resolve()
    })
  },
  youtubizeResult ({ commit }, convertedTracks) {
    return new Promise((resolve, reject) => {
      commit('YOUTUBIZE_RESULT', convertedTracks)
      resolve()
    })
  },
  setConvertedTracksProcessedFlag ({ commit }, val) {
    return new Promise((resolve, reject) => {
      commit('SET_CONVERTED_TRACKS_PROCESSED_FLAG', val)
      resolve()
    })
  },
  commitTrackChanges ({ commit }, id) {
    return new Promise((resolve, reject) => {
      commit('COMMIT_TRACK_CHANGES', id)
      resolve()
    })
  },
  changeYtTrackSelection ({ commit }, {trackId, newId}) {
    return new Promise((resolve, reject) => {
      const res = commit('CHANGE_YT_TRACK_SELECTION', {trackId, newId})
      if (res && res.succeeded) resolve()
      // else reject(res && res.error)
    })
  },
  unsyncPlaylist ({commit}, id) {
    return new Promise((resolve, reject) => {
      commit('UNSYNC_PLAYLIST', id)
      resolve()
    })
  },
  customTrackUrl ({commit}, {details, trackId}) {
    return new Promise((resolve, reject) => {
      commit('CUSTOM_TRACK_URL', {details, trackId})
      resolve()
    })
  }
}

const mutations = {
  STORE_DATA_FROM_DISK (state, data) {
    let {cachedPlaylists, control, playlists, queuedPlaylists, syncedPlaylists, deletedPlaylists, user, convertedTracks, lastSync} = data
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
  },
  UPDATE_USER_ENTITIES (state, object) {
    LOADING(this, true, 'Computing Changes')

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

    state.user = object.user
    state.user.logged = object.request.logged
    state.user.SBID = object.request.SBID

    if (state.cachedPlaylists.length > 0 || state.syncedPlaylists.length > 0) {
      for (let i = 0; i < object.playlists.items.length; i++) {
        let currentPlaylist = object.playlists.items[i]
        let cachedOrSynced = isCachedOrSynced(currentPlaylist.id)
        if (!cachedOrSynced.c && !cachedOrSynced.s) {
          object.playlists.items[i].items = []
          object.playlists.items[i].added = []
          object.playlists.items[i].removed = []
        }

        if (cachedOrSynced.c !== false) {
          // console.log('IS CACHED::')
          if (cachedOrSynced.c === currentPlaylist.snapshot_id) {
            object.playlists.items.splice(i, 1, state.playlists[findById(currentPlaylist.id, state.playlists)])
          } else {
            this.dispatch('findAndUncache', currentPlaylist.id)
          }
          continue
        }
        if (cachedOrSynced.s) {
          // If playlist is synced, it will have already been processed, so im just replacing it
          let index = findById(currentPlaylist.id, state.playlists)
          object.playlists.items.splice(i, 1, state.playlists[index])
          continue
        }
      }
    } else {
      // console.log('NO CACHED OR SYNCED PLS')
      for (let i = 0; i < object.playlists.items.length; i++) {
        object.playlists.items[i].tracks = {
          ...object.playlists.items[i].tracks,
          items: [],
          added: [],
          removed: []
        }
      }
    }

    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let pl = state.syncedPlaylists[i]
      let index = findById(pl, object.playlists.items)
      if (index === -1) {
        if (!state.deletedPlaylists) state.deletedPlaylists = []
        state.deletedPlaylists.push(state.playlists[findById(pl, state.playlists)])
        state.syncedPlaylists.splice(i, 1)
        i--
      }
    }

    Vue.set(state, 'playlists', object.playlists.items)

    state.control = {
      total: object.playlists.total,
      offset: state.playlists.length
    }

    state.lastSync = new Date()
    LOADING(this)
    this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
    SAVE_TO_DISK()
  },

  UPDATE_PLAYLISTS (state, playlists) {
    for (let i = 0; i < playlists.items.length; i++) {
      Vue.set(state.playlists, state.playlists.length, playlists.items[i])
    }

    Vue.set(state.control, 'offset', state.playlists.length)

    console.log('PLAYLISTS UPDATE::::::')
    SAVE_TO_DISK()
  },

  LOGOUT (state) {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
    console.log(state)
  },

  PLAYLIST_STORE_TRACKS (state, playlist) {
    playlist = {...playlist}

    if (playlist.same_version === true) {
      // If backend says it's the same version, no overwrite
      console.log('RETRIEVED SAME VERSION. NOT OVERWRITTING')
      return
    }

    let index = findById(playlist.id, state.playlists)
    // If there are changes with local version, overwrite
    if (index === -1) return console.error('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')

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

      let oldPl = [
        ...statePl.tracks.items,
        ...statePl.tracks.removed
      ]
      // Compute track changes
      // Using just removed and items. Im not using added because they will pop up in the new data.
      let {items, removed, added} = playlistComputeChanges(oldPl, playlist.tracks.items)
      playlist.tracks = {
        ...playlist.tracks,
        items,
        added,
        removed
      }
    } else {
      // Playlist was not synced before so I dont care about computing changes
      playlist.tracks = {
        ...playlist.tracks,
        added: [],
        removed: []
      }
      let {id, snapshot_id} = playlist
      this.dispatch('playlistUpdateCached', {id, snapshot_id})
      FSController.UserMethods.setFolderIcons(playlist.id, {force: true}) // creates folder and sets icon
    }
    state.playlists.splice(index, 1, playlist)
    // console.log('SON, ITS TIME NOW', state.playlists[index].tracks.added.map(p => p.name))
    this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})

    SAVE_TO_DISK()
  },

  PLAYLIST_UPDATE_CACHED (state, {id, snapshot_id}) {
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
  SET_CURRENT_PLAYLIST (state, id) {
    state.currentPlaylist = id
  },
  QUEUE_PLAYLIST (state, id) {
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
  FIND_AND_UNQUEUE (state, {id}) {
    let index = findById(id, state.queuedPlaylists.map(pl => {
      return {id: pl}
    }))
    // console.log('Unqueueing', id, index)
    if (index >= 0) {
      state.queuedPlaylists.splice(index, 1)
    }
  },
  FIND_AND_UNCACHE (state, {id}) {
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
    state.convertedTracks = cloneObject(state.convertedTracks).filter(track => {
      track.playlists = track.playlists.filter(pl => {
        const playlist = playlists.find(p => p.id === pl.id)
        return (playlist && playlist.tracks.items.some(t => t.id === track.id))
      })
      return track.playlists.length
    })
  },
  REPROCESS_ALL_TRACKS (params = {}) {
    Vue.set(state, 'convertedTracks', state.convertedTracks.map(convertedTrack => {
      if (params.resetSelection) convertedTrack.selection = null
      if (convertedTrack.custom) {
        convertedTrack.custom.isCustomTrack = true
        if (params.forceCustom) convertedTrack.selection = false
      }
      if (!convertedTrack.flags) {
        convertedTrack.flags = {
          converted: !!convertedTrack.conversion,
          conversionError: !convertedTrack.conversion
        }
      }
      return trackUtils.calculateBestMatch(convertedTrack, true)
    }).filter(t => t))
    console.log('all tracks reprocessed')
    this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
  },
  async YOUTUBIZE_RESULT (state, convertedTracks) {
    state.convertedTracks = convertedTracks.map(convertedTrack => trackUtils.calculateBestMatch(convertedTrack)).filter(t => t);

    ([...state.queuedPlaylists]).forEach(pl => {
      state.syncedPlaylists.push(pl)
      state.queuedPlaylists = state.queuedPlaylists.filter(p => p !== pl)
      state.cachedPlaylists = state.cachedPlaylists.filter(p => p.id !== pl)
    })
    console.log(state.convertedTracks.length)

    state.syncedPlaylists.forEach(async pl => this.dispatch('commitTrackChanges', pl))

    this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
    console.log(state.convertedTracks.some(t => t) && state.convertedTracks.some(t => t.flags))
    // setTimeout(((env) => {
    //   return () => env.dispatch('setConvertedTracksProcessedFlag')
    // })(this), 100)
    SAVE_TO_DISK()
  },
  SET_CONVERTED_TRACKS_PROCESSED_FLAG (state, val = true) {
    state.convertedTracks.forEach(t => t.flags.processed = val)
  },
  COMMIT_TRACK_CHANGES (state, id) {
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
  CHANGE_YT_TRACK_SELECTION (state, {trackId, newId}) {
    const retorno = {
      succeeded: false,
      error: null
    }
    if (newId === undefined) return (retorno.error = new Error('New selection id does not exist:: CurrentUser.js :: CHANGE_YT_TRACK_SELECTION')) && retorno

    const track = state.convertedTracks.find(t => t.id === trackId)
    if (!track) return (retorno.error = new Error('Converted Track not found:: CurrentUser.js :: CHANGE_YT_TRACK_SELECTION')) && retorno

    track.selection = newId
    track.flags.selectionIsApplied = true

    SAVE_TO_DISK()
    return (retorno.succeeded = true) && retorno
  },
  async UNSYNC_PLAYLIST (state, id) {
    // Removes tracks from conversion
    console.log('UNSYNCING ', id)
    let index = findById(id, state.syncedPlaylists)
    let success = false
    if (index !== -1) {
      state.syncedPlaylists.splice(index, 1)
      index = findById(id, state.playlists)
      if (index !== -1) {
        success = true
        state.playlists[index].tracks = {
          ...state.playlists[index].tracks,
          removed: state.playlists[index].tracks.items,
          items: [],
          added: []
        }

        await this.dispatch('commitTrackChanges', id)
      }
    }
    if (success) {
      FSController.UserMethods.deletePlaylist(state.playlists[index].name, () => {
        this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
        this.dispatch('playlistUnsynced', {}, {root: true})
        SAVE_TO_DISK()
      })
    } else console.error('Playlist not found when unsyncing :: UNSYNC_PLAYLIST')
  },
  CUSTOM_TRACK_URL (state, {details, trackId}) {
    const track = state.convertedTracks[findById(trackId, state.convertedTracks)]
    if (!track) return console.error('TRACK NOT FOUND IN CONVERTED TRACKS :: CUSTOM_TRACK_URL')

    details.isCustomTrack = true
    track.custom = details
    track.selection = false
    SAVE_TO_DISK()
  }
}

const getters = {
  RequestParams: state => {
    return {
      userId: state.user.id,
      logged: state.user.logged,
      SBID: state.user.SBID,
      control: state.control
    }
  },
  PlaylistById: (state) => function (id) {
    let pl = state.playlists[findById(id, state.playlists)]
    if (!pl || pl.tracks === null || pl.tracks === undefined) return null
    return pl
  },
  CurrentPlaylist: (state, getters) => {
    return getters.PlaylistById(state.currentPlaylist)
  },
  SyncedPlaylistById: (state) => function (id) {
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let pl = state.syncedPlaylists[i]

      if (pl.id === id) {
        if (pl.tracks === null || pl.tracks === undefined) return null

        return pl
      }
    }
    return null
  },
  PlaylistIsCached: (state, getters) => function (id) {
    return findById(id, state.cachedPlaylists) >= 0
  },
  PlaylistIsQueued: (state, getters) => function (id) {
    return findById(id, getters.QueuedPlaylists)
  },
  PlaylistIsSynced: (state, getters) => function (id) {
    return findById(id, state.syncedPlaylists) >= 0
  },
  QueuedPlaylists: (state, getters) => {
    let all = []
    for (let i = 0; i < state.queuedPlaylists.length; i++) {
      all = [...all, getters.PlaylistById(state.queuedPlaylists[i])]
    }
    return all
  },
  UnCachedPlaylists: (state) => {
    let q = [...state.queuedPlaylists]
    let c = [...state.cachedPlaylists]
    let ret = []

    if (c.length === 0) return q

    for (let i = 0; i < q.length; i++) {
      let found = false

      for (let o = 0; o < c.length; o++) {
        if (q[i] === c[o].id) {
          found = true
          c.splice(o, 1)
        }
      }

      if (!found) ret = [...ret, q[i]]
    }
    return ret
  },
  // Number of Queued playlists and tracks to show in View
  SelectedPlaylistsCompute: (state) => {
    let q = state.queuedPlaylists
    let p = [ ...state.playlists ]

    let selectedPlaylists = {
      playlists: q.length,
      tracks: 0
    }

    for (let i = 0; i < state.queuedPlaylists.length; i++) {
      for (let o = 0; o < p.length; o++) {
        if (q[i] === p[o].id) {
          selectedPlaylists.tracks += p[o].tracks.total
          p.splice(o, 1)
        }
      }
    }

    return selectedPlaylists
  },
  // Returns differences between youtubeized results and local copy of spotify items
  PlaylistTrackChanges: (state, getters) => function (id) {
    // Starting with both local spotify copy and local youtube copy
    // Tracks will be compared between both arrays and if it's a match, then both will be spliced from both arrays
    // If there are no changes, then both arrays will be empty

    let added = [...getters.PlaylistById(id).tracks.items]
    let removed = getters.SyncedPlaylistById(id)

    if (removed !== null && removed.tracks.length > 0) { // This checks if the synced playlist has not been added to DB yet, if so, then every song will be 'new'
      removed = [...removed.tracks]

      let i = 0
      while (i < added.length) {
        let a = added[i]
        let found = false

        for (let o = 0; o < removed.length; o++) {
          let r = removed[o]

          if (a.id === r.id) {
            // No changes to track
            found = true
            added.splice(i, 1)
            removed.splice(o, 1)
            break
          }
        }
        if (!found) i++
      }
    } else removed = []

    return {added, removed}
  },

  SyncedPlaylistsWithNewTracks: (state, getters) => {
    let syncedPls = getters.SyncedPlaylists
    let devolver = []
    for (let i = 0; i < syncedPls.length; i++) {
      let pl = syncedPls[i]
      let added = getters.PlaylistTrackChanges(pl.id).added

      if (added.length === 0) continue

      pl = getters.PlaylistById(pl.id)
      devolver = [...devolver,
        {
          ...pl,
          tracks: {
            items: added
          }
        }]
    }

    return devolver
  }
}

export default {
  state,
  actions,
  mutations,
  getters
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

function cloneObject (aObject) {
  return clone(aObject)
}

function clone (aObject) {
  if (!aObject) {
    return aObject
  }

  let v
  let bObject = Array.isArray(aObject) ? [] : {}
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = (typeof v === 'object') ? clone(v) : v
  }

  return bObject
}
