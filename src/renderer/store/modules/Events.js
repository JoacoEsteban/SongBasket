// import Vue from 'vue'

const state = {
  CURRENT_PLAYLIST_SET: false,
  SYNCED_PLAYLISTS_REFRESHED: false,
  PLAYLIST_UNSYNCED: false,
  ROUTER_ANIMATION: '',
  GLOBAL_LOADING_STATE: {
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
  routerAnimation ({commit}, animation) {
    commit('ROUTER_ANIMATION', animation)
  },
  globalLoadingState ({commit}, value) {
    commit('GLOBAL_LOADING_STATE', value)
  }
}

const mutations = {
  TRIGGER (state, key) {
    state[key] = !state[key]
  },
  ROUTER_ANIMATION (state, animation) {
    state.ROUTER_ANIMATION = animation
  },
  GLOBAL_LOADING_STATE (state, {value, target}) {
    if (!target) target = ''
    state.GLOBAL_LOADING_STATE = {value, target}
  }
}

export default {
  state,
  actions,
  mutations
}
