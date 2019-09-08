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
    commit('PLAYLIST_STORE_TRACKS', playlist)
  },
  playlistUpdateCached ({ commit }, id) {
    commit('PLAYLIST_UPDATE_CACHED', id)
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
  youtubizeResult ({ commit }, youtubizedResult) {
    return new Promise((resolve, reject) => {
      commit('YOUTUBIZE_RESULT', youtubizedResult)
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
    console.log(`INITIALIZING USER::: ${object.user.id}`)

    state.user = object.user
    state.user.logged = object.request.logged
    state.user.SBID = object.request.SBID

    state.playlists = object.playlists.items

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
    console.log('STORING ' + playlist.tracks.items.length + ' TRACKS FOR PLAYLIST WITH ID ' + playlist.id)

    let index = findInPls(playlist.id, state.playlists)

    if (index >= 0) {
      state.playlists.splice(index, 1, playlist)
      this.dispatch('playlistUpdateCached', playlist.id)
    } else console.log('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')
  },

  PLAYLIST_UPDATE_CACHED (state, id) {
    for (let i = 0; i < state.cachedPlaylists.length; i++) {
      let p = state.cachedPlaylists[i]
      if (p.id === id) {
        p = {id: p.id, time: Date.now()}
        console.log('UPDATING CACHE LOG FOR PLAYLIST WITH ID ' + id)
        return
      }
    }
    console.log('UPDATING CACHE LOG')
    state.cachedPlaylists = [ ...state.cachedPlaylists, { id: id, time: Date.now() } ]
  },
  SET_CURRENT_PLAYLIST (state, id) {
    console.log('SETTING PLAYLIST WITH ID ' + id + ' AS SELECTED')
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
    console.log('Unqueueing', id, index)
    if (index >= 0) {
      state.queuedPlaylists.splice(index, 1)
    }
  },
  YOUTUBIZE_RESULT (state, youtubizedResult) {
    // Unqueueing synced playlists
    console.log('RESULT::', youtubizedResult)
    for (let i = 0; i < youtubizedResult.length; i++) {
      this.dispatch('findAndUnqueue', youtubizedResult[i].id)
    }

    if (state.syncedPlaylists.length === 0) {
      state.syncedPlaylists = youtubizedResult
      return
    }

    // This Immense for loop replaces already fetched results for some reason lol
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let pl = state.syncedPlaylists[i]

      for (let o = 0; o < youtubizedResult.length; o++) {
        let ytpl = youtubizedResult[o]

        // If Fetched playlists already exists in VUEX
        if (pl.id === ytpl.id) {
          // Cycle through tracks
          for (let u = 0; u < pl.tracks.length; u++) {
            let trackSt = pl.tracks[u]

            for (let y = 0; y < ytpl.tracks.length; y++) {
              let trackYt = ytpl.tracks[y]
              if (trackSt.id === trackYt.id) {
                // Replace with new Data directly into state
                state.syncedPlaylists[i].tracks.splice(u, 1, trackYt)
                // Popit from fetched tracks
                ytpl.tracks.splice(y, 1)
                break
              }
            }
          }
          // Adds remaining new songs directly into state
          if (ytpl.tracks.length > 0) state.syncedPlaylists[i].tracks = [...pl.tracks, ...ytpl.tracks]

          youtubizedResult.splice(o, 1)
          break
        }
      }
    }
    // Adds remaining new playlists directly into state
    if (youtubizedResult.length > 0) state.syncedPlaylists = [...state.syncedPlaylists, ...youtubizedResult]
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
  SyncedPlaylist: (state) => function (id) {
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
    if (ret.length === 0) ret = null
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
