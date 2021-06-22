// @ts-nocheck
/* eslint-disable camelcase */
import Vue from 'vue'

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

const dispatchAppropiateEvent = {
  events: {
    'playlistStateChanged': ['playlists', 'syncedPlaylists', 'deletedPlaylists'],
    'reComputeConvertedTracks': ['convertedTracks']
  },
  getEvent (actualKey) {
    return Object.keys(this.events).filter(key => this.events[key].some(state => state === actualKey))
  },
  async send (env, key) {
    const events = this.getEvent(key)
    if (events.length) events.asyncForEach(async event => env.dispatch(event, {}, { root: true }))
  }
}

const actions = {
  set ({ commit }, { key, value }) {
    return new Promise((resolve, reject) => {
      commit('SET', { key, value })
      dispatchAppropiateEvent.send(this, key)
      resolve()
    })
  },
  setState ({ commit }, newState) {
    return new Promise((resolve, reject) => {
      commit('SET_STATE', newState)
      resolve()
    })
  },
  setUser ({ commit }, userData) {
    return new Promise((resolve, reject) => {
      commit('SET_USER', userData)
      resolve()
    })
  },
  logout ({ commit }) {
    commit('LOGOUT')
  },
  setCurrentPlaylist ({ commit }, id) {
    commit('SET_CURRENT_PLAYLIST', id)
    this.dispatch('currentPlaylistSet', {}, { root: true })
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
  },
  SET_USER (state, userData) {
    state.user = userData
  },
  LOGOUT (state) {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
    console.log(state)
  },
  SET_CURRENT_PLAYLIST (state, id) {
    state.currentPlaylist = id
  }
}

const getters = {
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
    let p = [...state.playlists]

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

    return { added, removed }
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
