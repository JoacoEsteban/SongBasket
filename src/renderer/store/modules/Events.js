// import Vue from 'vue'

const state = {
  SYNCED_PLAYLISTS_REFRESHED: false
}

const actions = {
  syncedPlaylistsRefreshed ({commit}) {
    commit('SYNCED_PLAYLISTS_REFRESHED')
  }
}

const mutations = {
  SYNCED_PLAYLISTS_REFRESHED (state) {
    state.SYNCED_PLAYLISTS_REFRESHED = !state.SYNCED_PLAYLISTS_REFRESHED
  }
}

export default {
  state,
  actions,
  mutations
}
