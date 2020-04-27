import Vue from 'vue'

const getDefaultState = () => ({
  CURRENT_PLAYLIST_SET: false,
  SYNCED_PLAYLISTS_REFRESHED: false,
  PLAYLIST_UNSYNCED: false,
  RESET_SELECTION: false,
  ROUTER_ANIMATION: '',
  GLOBAL_LOADING_STATE: {
    value: false,
    target: ''
  },
  LOADING_STATE: loadingEventTypes.default,
  DOWNLOAD_QUEUE: [],
  CURRENT_DOWNLOAD: null // id from current download
})

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
  globalLoadingStateDEPRECATED ({commit}, value) {
    value.target = value.target || ''
    commit('SET', { key: 'GLOBAL_LOADING_STATE', value })
  },
  loadingEvent ({commit}, payload) {
    console.log('averga', payload)
    commit('LOADING_EVENT', payload)
  }
}

const SET = (key, value) => Vue.set(state, key, value)
const mutations = {
  TRIGGER (state, key) {
    state[key] = !state[key]
  },
  SET (state, {key, value}) {
    SET(key, value)
  },
  DOWNLOAD_STARTED (state, tracks) {
    state.DOWNLOAD_QUEUE = tracks.map(id => ({
      id, // song id
      state: 'awaiting', // eg: downloading, extracting, applying tags
      ptg: 0 // eg: 36%
    }))
  },
  LOADING_EVENT (state, {target, value, ptg}) {
    const formatted = getLoadingEvent(target)
    formatted.target = target
    formatted.value = value
    formatted.ptg = ptg || 0
    SET('LOADING_STATE', formatted)
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

const loadingEventTypes = {
  messages: {
    'PLAYLISTS:REFRESH': 'Updating Playlists',
    'YOUTUBIZE': 'Converting Tracks',
    'DOWNLOAD': 'Downloading Tracks',
    'PLAYLIST:UNSYNC': 'Unsyncing Playlist',
    default: 'Loading'
  },
  getMessage (target) {
    return this.messages[target] || this.messages.default
  },
  defaultMessage (env) {
    return this.getMessage(env.target)
  },
  // -----------------------
  get default () {
    return {
      value: false,
      target: '',
      showPtg: false,
      ptg: null,
      get message () {
        return loadingEventTypes.defaultMessage(this)
      }
    }
  },
  get percentable () {
    return {
      value: false,
      target: '',
      showPtg: true,
      ptg: 0,
      get message () {
        return loadingEventTypes.defaultMessage(this) + ' ' + (this.ptg * 100).toFixed(1) + '%'
      }
    }
  }
}

function getLoadingEvent (target) {
  switch (target) {
    case 'PLAYLISTS:REFRESH':
      return loadingEventTypes.percentable
    case 'YOUTUBIZE':
      return loadingEventTypes.percentable
    case 'DOWNLOAD':
      return loadingEventTypes.default
    case 'PLAYLIST:UNSYNC':
      return loadingEventTypes.default
    default:
      return loadingEventTypes.default
  }
}

const state = getDefaultState()

export default {
  state,
  actions,
  mutations
}
