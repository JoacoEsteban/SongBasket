import Vue from 'vue'

const state = {
  CURRENT_PLAYLIST_SET: false,
  SYNCED_PLAYLISTS_REFRESHED: false,
  PLAYLIST_UNSYNCED: false,
  FFMPEG_BINS_DOWNLOADED: false,
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
  routerAnimation ({commit}, animation) {
    commit('ROUTER_ANIMATION', animation)
  },
  globalLoadingState ({commit}, value) {
    commit('SET', { key: 'GLOBAL_LOADING_STATE', value })
  },
  fetchLoadingState ({commit}, value) {
    commit('SET', { key: 'FETCH_LOADING_STATE', value })
  },
  ffmpegBinsDownloaded ({commit}) {
    setTimeout(() => {
      commit('TRIGGER', 'FFMPEG_BINS_DOWNLOADED')
    }, 1000)
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
  }
}

export default {
  state,
  actions,
  mutations
}
