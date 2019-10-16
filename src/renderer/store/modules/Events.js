// import Vue from 'vue'

const state = {
  SYNCED_PLAYLISTS_REFRESHED: false,
  GLOBAL_LOADING_STATE: {
    value: false,
    target: ''
  }
}

const actions = {
  syncedPlaylistsRefreshed ({commit}) {
    commit('SYNCED_PLAYLISTS_REFRESHED')
  },
  globalLoadingState ({commit}, value) {
    commit('GLOBAL_LOADING_STATE', value)
  }
}

const mutations = {
  SYNCED_PLAYLISTS_REFRESHED (state) {
    state.SYNCED_PLAYLISTS_REFRESHED = !state.SYNCED_PLAYLISTS_REFRESHED
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
