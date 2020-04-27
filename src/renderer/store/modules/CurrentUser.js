/* eslint-disable camelcase */
import Vue from 'vue'
// import FSController from '../../../main/controllers/FileSystem/index'

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
  // FSController.UserMethods.saveState({state, path: global.HOME_FOLDER})
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
  set ({commit}, {key, value}) {
    return new Promise((resolve, reject) => {
      commit('SET', {key, value})
      resolve()
    })
  },
  setState ({commit}, newState) {
    return new Promise((resolve, reject) => {
      commit('SET_STATE', newState)
      resolve()
    })
  },
  storeDataFromDisk ({commit}, data) {
    return new Promise((resolve, reject) => {
      commit('STORE_DATA_FROM_DISK', data)
      resolve()
    })
  },
  setUser ({commit}, userData) {
    return new Promise((resolve, reject) => {
      commit('SET_USER', userData)
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
      try {
        commit('PLAYLIST_STORE_TRACKS', playlist)
        resolve()
      } catch (error) {
        reject(error)
      }
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
      try {
        commit('YOUTUBIZE_RESULT', convertedTracks)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  },
  invalidateSyncedSnapshotIds ({ commit }) {
    return new Promise((resolve, reject) => {
      commit('INVALIDATE_SYNCED_SNAPSHOT_IDS')
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
  SET (state, { key, value }) {
    Vue.set(state, key, value)
  },
  SET_STATE (state, newState) {
    for (const key in newState) {
      Vue.set(state, key, newState[key])
    }
    this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
  },
  SET_USER (state, userData) {
    state.user = userData
  },

  LOGOUT (state) {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
    console.log(state)
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
  // REPROCESS_ALL_TRACKS (params = {}) {
  //   Vue.set(state, 'convertedTracks', state.convertedTracks.map(convertedTrack => {
  //     if (params.resetSelection) convertedTrack.selection = null
  //     if (convertedTrack.custom) {
  //       convertedTrack.custom.isCustomTrack = true
  //       if (params.forceCustom) convertedTrack.selection = false
  //     }
  //     if (!convertedTrack.flags) {
  //       convertedTrack.flags = {
  //         converted: !!convertedTrack.conversion,
  //         conversionError: !convertedTrack.conversion
  //       }
  //     }
  //     return trackUtils.calculateBestMatch(convertedTrack, true)
  //   }).filter(t => t))
  //   console.log('all tracks reprocessed')
  //   this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
  // },
  // async YOUTUBIZE_RESULT (state, convertedTracks) {
  //   state.convertedTracks = convertedTracks.map(convertedTrack => trackUtils.calculateBestMatch(convertedTrack)).filter(t => t);

  //   ([...state.queuedPlaylists]).forEach(pl => {
  //     state.syncedPlaylists.push(pl)
  //     state.queuedPlaylists = state.queuedPlaylists.filter(p => p !== pl)
  //     state.cachedPlaylists = state.cachedPlaylists.filter(p => p.id !== pl)
  //   })
  //   console.log('Total converted tracks', state.convertedTracks.length)

  //   state.syncedPlaylists.forEach(async pl => this.dispatch('commitTrackChanges', pl))

  //   this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
  //   // console.log(state.convertedTracks.some(t => t) && state.convertedTracks.some(t => t.flags))
  //   // setTimeout(((env) => {
  //   //   return () => env.dispatch('setConvertedTracksProcessedFlag')
  //   // })(this), 100)
  //   SAVE_TO_DISK()
  // },
  INVALIDATE_SYNCED_SNAPSHOT_IDS (state) {
    state.syncedPlaylists.map(id => state.playlists.find(pl => pl.id === id)).forEach(pl => {
      if (!pl) throw new Error('SYNCED PLAYLIST NOT FOUND IN PLAYLIST LIST')
      pl.snapshot_id = ''
    })
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
  // async UNSYNC_PLAYLIST (state, id) {
  //   // Removes tracks from conversion
  //   console.log('UNSYNCING ', id)
  //   let index = findById(id, state.syncedPlaylists)
  //   let success = false
  //   if (index !== -1) {
  //     state.syncedPlaylists.splice(index, 1)
  //     index = findById(id, state.playlists)
  //     if (index !== -1) {
  //       success = true
  //       state.playlists[index].tracks = {
  //         ...state.playlists[index].tracks,
  //         removed: state.playlists[index].tracks.items,
  //         items: [],
  //         added: []
  //       }

  //       await this.dispatch('commitTrackChanges', id)
  //     }
  //   }
  //   if (success) {
  //     FSController.UserMethods.deletePlaylist(state.playlists[index].name, () => {
  //       this.dispatch('syncedPlaylistsRefreshed', {}, {root: true})
  //       this.dispatch('playlistUnsynced', {}, {root: true})
  //       SAVE_TO_DISK()
  //     })
  //   } else console.error('Playlist not found when unsyncing :: UNSYNC_PLAYLIST')
  // },
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
