import Vue from 'vue'

const state = {
  CURRENT_PLAYLIST_SET: false,
  SYNCED_PLAYLISTS_REFRESHED: false,
  PLAYLIST_UNSYNCED: false,
  RESET_SELECTION: false,
  ROUTER_ANIMATION: '',
  GLOBAL_LOADING_STATE: {
    value: false,
    target: ''
  },
  FETCH_LOADING_STATE: {
    value: false,
    target: ''
  }
}

const actions = {
  currentPlaylistSet ({commit}) {
    commit('TRIGGER', 'CURRENT_PLAYLIST_SET')
  },
  syncedPlaylistsRefreshed ({commit}) {
    commit('TRIGGER', 'SYNCED_PLAYLISTS_REFRESHED')
  },
  playlistUnsynced ({commit}) {
    commit('TRIGGER', 'PLAYLIST_UNSYNCED')
  },
  resetSelection ({commit}) {
    commit('TRIGGER', 'RESET_SELECTION')
  },
  routerAnimation ({commit}, animation) {
    commit('ROUTER_ANIMATION', animation)
  },
  downloadEvent ({commit}, params) {
    commit('SET', { key: 'DOWNLOAD_EVENT', params })
  },
  conversionEvent ({commit}, params) {
    commit('SET', { key: 'CONVERSION_EVENT', params })
  },
  globalLoadingState ({commit}, value) {
    value.target = value.target || ''
    commit('SET', { key: 'GLOBAL_LOADING_STATE', value })
  },
  fetchLoadingState ({commit}, value) {
    commit('SET', { key: 'FETCH_LOADING_STATE', value })
  }
}

const mutations = {
  TRIGGER (state, key) {
    state[key] = !state[key]
  },
  ROUTER_ANIMATION (state, animation) {
    state.ROUTER_ANIMATION = animation
  },
  SET (state, {key, value}) {
    Vue.set(state, key, value)
  },
  DOWNLOAD_EVENT (state, params) {

  },
  CONVERSION_EVENT (state, params) {

  }
}

export default {
  state,
  actions,
  mutations
}
