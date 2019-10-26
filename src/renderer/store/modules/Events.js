// import Vue from 'vue'

const state = {
  CURRENT_PLAYLIST_SET: false,
  SYNCED_PLAYLISTS_REFRESHED: false,
  PLAYLIST_UNSYNCED: false,
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
  globalLoadingState ({commit}, value) {
    commit('GLOBAL_LOADING_STATE', value)
  }
}

const mutations = {
  TRIGGER (state, key) {
    console.log('ckeckme out')
    state[key] = !state[key]
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
