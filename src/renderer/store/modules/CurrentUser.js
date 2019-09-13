/* eslint-disable camelcase */
import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolder: null
    },
    user: {}, // Includes name, number of playlists, image url
    playlists: [],
    cachedPlaylists: [],
    syncedPlaylists: [],
    control: {},
    currentPlaylist: '',
    queuedPlaylists: []
  }
}

const state = getDefaultState()

const actions = {
  setHomeFolder ({ commit }, path) {
    commit('SET_HOME_FOLDER', path)
  },
  initUser ({ commit }, object) {
    commit('INIT_USER', object)
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
    return new Promise((resolve, reject) => {
      commit('SET_CURRENT_PLAYLIST', id)
      resolve()
    })
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
  youtubizeResult ({ commit }, youtubizedResult) {
    return new Promise((resolve, reject) => {
      commit('YOUTUBIZE_RESULT', youtubizedResult)
      resolve()
    })
  },
  commitTrackChanges ({ commit }, id) {
    return new Promise((resolve, reject) => {
      commit('COMMIT_TRACK_CHANGES', id)
      resolve()
    })
  }
}

const mutations = {
  SET_HOME_FOLDER (state, path) {
    console.log(`SETTING HOME FOLDER::: ${path}`)
    state.fileSystem.homeFolder = path
  },
  INIT_USER (state, object) {
    // TODO VERSION CONTROL SYNCED PLS FROM HERE AND KEEP REMOVED TRACKS INSIDE THE SYNCED PL OBJECT
    function isCachedOrSynced (id) {
      let c = findInPls(id, state.cachedPlaylists)
      let s = findInPls(id, state.syncedPlaylists)
      return {c, s}
    }

    state.user = object.user
    state.user.logged = object.request.logged
    state.user.SBID = object.request.SBID
    // console.log('SYNNNasfasdf')
    // let damajuana

    if (state.cachedPlaylists.length > 0 || state.syncedPlaylists.length > 0) {
      for (let i = 0; i < object.playlists.items.length; i++) {
        let cachedOrSynced = isCachedOrSynced(object.playlists.items[i].id)

        if (cachedOrSynced.c >= 0) {
          // console.log('IS CACHED::')
          object.playlists.items.splice(i, 1, state.playlists[findInPls(object.playlists.items[i].id, state.playlists)])
          continue
        }
        if (cachedOrSynced.s >= 0) {
          console.log('IS SYNCED::')
          // damajuana = i
          object.playlists.items.splice(i, 1, state.playlists[findInPls(object.playlists.items[i].id, state.playlists)])
          continue
        }
      }
    } else {
      // console.log('NO CACHED OR SYNCED PLS')
    }

    state.playlists = object.playlists.items
    // TODO Finish finding wtf is going on with added tracks
    // console.log('SYNNN', state.playlists[damajuana].tracks.added, state.playlists[damajuana].tracks.items.length, state.playlists[damajuana].tracks.removed.length)

    state.control = {
      total: object.playlists.total,
      offset: state.playlists.length
    }
  },

  UPDATE_PLAYLISTS (state, playlists) {
    for (let i = 0; i < playlists.items.length; i++) {
      Vue.set(state.playlists, state.playlists.length, playlists.items[i])
    }

    Vue.set(state.control, 'offset', state.playlists.length)

    console.log('PLAYLISTS UPDATE::::::')
  },

  LOGOUT (state) {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
    console.log(state)
  },

  PLAYLIST_STORE_TRACKS (state, playlist) {
    playlist = {...playlist}
    // TODO FIx this shit getting in twice for no reason
    function playlistComputeChanges (oldPl, newPl) {
      // Starting with both local spotify copy and local youtube copy
      // Tracks will be compared between both arrays and if it's a match, then both will be spliced from both arrays
      // If there are no changes, then both arrays will be empty

      let added = [ ...newPl ]
      let removed = [ ...oldPl ]
      let items = [] // Tracks that are preserved between versions

      console.log('CHECK ME OUT:::', added, removed)

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

    if (playlist.same_version === true) {
      // If backend says it's the same version, no overwrite
      console.log('RETRIEVED SAME VERSION. NOT OVERWRITTING')
      return
    }

    console.log('STORING ' + playlist.tracks.items.length + ' TRACKS FOR PLAYLIST WITH ID ' + playlist.id)

    let index = findInPls(playlist.id, state.playlists)
    // If there are changes with local version, overwrite
    if (index >= 0) {
      // If playlist is synced, then I will compute differences with previous local version
      let syncIndex = findInPls(playlist.id, state.syncedPlaylists)
      if (syncIndex >= 0) {
        let oldPl = [
          ...state.playlists[index].tracks.items,
          ...state.playlists[index].tracks.added,
          ...state.playlists[index].tracks.removed
        ]
        // Compute track changes
        // Using all tracks from old playlist (removed and added. Im comparing with latest version of pl so no problemo)
        let {items, removed, added} = playlistComputeChanges(oldPl, playlist.tracks.items)
        playlist.tracks = {
          ...playlist.tracks,
          items,
          added,
          removed
        }
        console.log('SON, ITS TIME NOW', playlist.tracks.added.map(p => p.name))
        state.syncedPlaylists[syncIndex].snapshot_id = playlist.snapshot_id
      } else {
        // Playlist is not synced so I dont care about computing changes
        playlist.tracks = {
          ...playlist.tracks,
          added: [],
          removed: []
        }
        let {id, snapshot_id} = playlist
        this.dispatch('playlistUpdateCached', {id, snapshot_id})
      }
      state.playlists.splice(index, 1, playlist)
      console.log('SON, ITS TIME NOW', state.playlists[index].tracks.added.map(p => p.name))
    } else console.log('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')
  },

  PLAYLIST_UPDATE_CACHED (state, {id, snapshot_id}) {
    for (let i = 0; i < state.cachedPlaylists.length; i++) {
      let p = state.cachedPlaylists[i]
      if (p.id === id) {
        p = {id, time: Date.now(), snapshot_id}
        // console.log('UPDATING CACHE LOG FOR PLAYLIST WITH ID ' + id)
        return
      }
    }
    state.cachedPlaylists = [ ...state.cachedPlaylists, { id, time: Date.now(), snapshot_id } ]
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
  FIND_AND_UNQUEUE (state, {id, getters}) {
    let index = findInPls(id, state.queuedPlaylists.map(pl => {
      return {id: pl}
    }))
    // console.log('Unqueueing', id, index)
    if (index >= 0) {
      state.queuedPlaylists.splice(index, 1)
    }
  },
  FIND_AND_UNCACHE (state, {id, getters}) {
    let index = findInPls(id, state.cachedPlaylists)
    // console.log('Uncaching', id, index)
    if (index >= 0) {
      state.cachedPlaylists.splice(index, 1)
    }
  },
  YOUTUBIZE_RESULT (state, youtubizedResult) {
    // Unqueueing synced playlists
    // TODO Put this at the end of mutation
    // console.log('RESULT::', youtubizedResult.length)
    for (let i = 0; i < youtubizedResult.length; i++) {
      this.dispatch('findAndUnqueue', youtubizedResult[i].id)
      this.dispatch('findAndUncache', youtubizedResult[i].id)
    }

    // TODO Find snapshot inside cached array. Uncache then
    youtubizedResult = youtubizedResult.map(pl => {
      return {
        ...pl,
        snapshot_id: state.playlists[findInPls(pl.id, state.playlists)].snapshot_id
      }
    })

    if (state.syncedPlaylists.length === 0) {
      state.syncedPlaylists = [ ...youtubizedResult.map(pl => {
        // Declared this way in order not to add 'Removed' tracks array
        return {
          id: pl.id,
          tracks: pl.tracks,
          snapshot_id: pl.snapshot_id
        }
      })]
      return
    }

    // TODO Update tracks accordingly to version control
    // This Immense for loop replaces already fetched results for some reason lol
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let pl = state.syncedPlaylists[i]

      for (let o = 0; o < youtubizedResult.length; o++) {
        let ytpl = youtubizedResult[o]

        // If Fetched playlists already exists in VUEX
        if (pl.id === ytpl.id) {
          // Cycle through tracks and clear removed ones
          let localPl = {...state.playlists[findInPls(pl.id, state.playlists)]}
          for (let u = 0; u < pl.tracks.length; u++) {
            let trackSt = pl.tracks[u]

            for (let y = 0; y < localPl.tracks.removed.length; y++) {
              let trackRemoved = localPl.tracks.removed[y]
              if (trackSt.id === trackRemoved.id) {
                // Remove already removed (IN SPOTI DATA) track from YT SYNC state
                state.syncedPlaylists[i].tracks.splice(u, 1)
                // Popit from removed tracks 'log'
                localPl.tracks.removed.splice(y, 1)
                break
              }
            }
          }
          // Adds remaining new songs directly into state
          state.syncedPlaylists[i].tracks = [...pl.tracks, ...ytpl.tracks]
          // TODO Songs were removed from youtube state. Now to remove old ones and add new ones to spotify state
          this.dispatch('commitTrackChanges', pl.id)

          youtubizedResult.splice(o, 1)
          break
        }
      }
    }
    // Adds remaining new playlists directly into state
    // No need to 'commitTrackChanges' to this ones. Every song is New
    if (youtubizedResult.length > 0) {
      state.syncedPlaylists = [...state.syncedPlaylists, ...youtubizedResult]
    }
  },
  COMMIT_TRACK_CHANGES (state, id) {
    let index = findInPls(id, state.playlists)
    if (index === -1) {
      console.log('PLAYLIST NOT FOUND WHEN COMMITING CHANGES')
      return
    }
    let tracks = state.playlists[index].tracks
    state.playlists[index] = {
      ...state.playlists[index],
      tracks: {
        ...tracks,
        items: [...tracks.items, ...tracks.added],
        added: [],
        removed: []
      }
    }
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
    let pl = state.playlists[findInPls(id, state.playlists)]
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
    return findInPls(id, state.cachedPlaylists) >= 0
  },
  PlaylistIsQueued: (state, getters) => function (id) {
    return findInPls(id, getters.QueuedPlaylists)
  },
  PlaylistIsSynced: (state, getters) => function (id) {
    return findInPls(id, state.syncedPlaylists) >= 0
  },
  QueuedPlaylists: (state, getters) => {
    let all = []
    for (let i = 0; i < state.queuedPlaylists.length; i++) {
      all = [...all, getters.PlaylistById(state.queuedPlaylists[i])]
    }
    return all
  },
  SyncedPlaylists: (state, getters) => {
    let all = []
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      all = [...all, getters.SyncedPlaylistById(state.syncedPlaylists[i].id)]
    }
    return all
  },
  // Gives spotify object
  SyncedPlaylistsSp: (state, getters) => {
    let all = []
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      all = [...all, getters.PlaylistById(state.syncedPlaylists[i].id)]
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

function findInPls (id, pls) {
  for (let i = 0; i < pls.length; i++) {
    let pl = pls[i]
    if (pl.id === id) {
      return i
    }
  }
  return -1
}
