import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolder: null
    },
    user: {}, // Includes name, number of playlists, image url
    playlists: [],
    cachedPlaylists: [],
    control: {},
    currentPlaylist: '',
    syncedPlaylists: []
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
  clearUserNPlaylists ({ commit }) {
    commit('CLEAR_USER_N_PLAYLISTS')
  },
  playlistStoreTracks ({ commit }, {id, tracks}) {
    commit('PLAYLIST_STORE_TRACKS', {id, tracks})
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

  CLEAR_USER_N_PLAYLISTS (state) {
    console.log('CLEARING::::::::')
    Object.assign(state, getDefaultState())
    console.log(state)
  },

  PLAYLIST_STORE_TRACKS (state, {id, tracks}) {
    console.log('STORING ' + tracks.length + ' TRACKS FOR PLAYLIST WITH ID ' + id)

    let done = false
    for (let i = 0; i < state.playlists.length; i++) {
      let pl = state.playlists[i]

      if (pl.id === id) {
        pl.tracks.items = tracks
        done = true
        this.dispatch('playlistUpdateCached', id)
        console.log('DONE')
      }
    }
    if (!done) console.log('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')
  },

  PLAYLIST_UPDATE_CACHED (state, id) {
    for (let i = 0; i < state.cachedPlaylists.length; i++) {
      let p = state.cachedPlaylists[i]
      if (p.id === id) {
        p = {id: p.id, time: Date.now()}
        console.log('UPDATING CACHE LOG FOR PLAYLIST WITH ID' + id)
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
    console.log('QUEUEING PLAYLIST WITH ID ' + id)
    let found = false
    for (let i = 0; i < state.syncedPlaylists.length; i++) {
      let pl = state.syncedPlaylists[i]
      if (pl === id) {
        console.log('FOUND')
        found = true
        state.syncedPlaylists.splice(i, 1)
      }
    }
    if (!found) state.syncedPlaylists = [...state.syncedPlaylists, id]
    console.log(found, state.syncedPlaylists)
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
  CurrentPlaylist: (state) => {
    for (let i = 0; i < state.playlists.length; i++) {
      let pl = state.playlists[i]

      if (pl.id === state.currentPlaylist) {
        if (pl.tracks === null || pl.tracks === undefined) return null

        return pl
      }
    }
    return null
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
