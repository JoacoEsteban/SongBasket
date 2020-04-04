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
  },
  DOWNLOAD_QUEUE: [],
  CURRENT_DOWNLOAD: null // id from current download
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
    commit('SET', {key: 'ROUTER_ANIMATION', value: animation})
  },
  downloadStarted ({commit}, tracks) {
    commit('DOWNLOAD_STARTED', tracks)
  },
  downloadEvent ({commit}, params) {
    commit('DOWNLOAD_EVENT', params)
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
  SET (state, {key, value}) {
    Vue.set(state, key, value)
  },
  DOWNLOAD_STARTED (state, tracks) {
    state.DOWNLOAD_QUEUE = tracks.map(id => ({
      id, // song id
      state: 'awaiting', // eg: downloading, extracting, applying tags
      ptg: 0 // eg: 36%
    }))
  },
  DOWNLOAD_EVENT (state, {id, ptg, type}) {
    const track = state.DOWNLOAD_QUEUE.find(t => t.id === id)
    if (!track) return
    type = type.split(':')
    switch (type[0]) {
      case 'download':
        switch (type[1]) {
          case 'start':
            state.CURRENT_DOWNLOAD = id
            track.state = 'downloading'
            track.ptg = 0
            break
          case 'progress':
            track.state = 'downloading'
            track.ptg = ptg
            break
          case 'error':
            // TODO Handle error
            track.state = 'download_error'
            break
          case 'end':
            track.state = 'download_end'
            break
        }
        break
      case 'extraction':
        switch (type[1]) {
          case 'start':
            track.state = 'extracting'
            track.ptg = 0
            break
          case 'progress':
            track.ptg = ptg
            break
          case 'error':
            // TODO Handle error
            track.state = 'extraction_error'
            break
          case 'end':
            track.state = 'extraction_end'
            break
        }
        break
      case 'tags':
        switch (type[1]) {
          case 'start':
            track.state = 'tags'
            break
          // case 'progress':
          //   track.ptg = ptg
          //   break
          case 'error':
            // TODO Handle error
            track.state = 'tags_error'
            break
          case 'end':
            track.state = 'tags_end'
            break
        }
        break
    }
  }
}

export default {
  state,
  actions,
  mutations
}
