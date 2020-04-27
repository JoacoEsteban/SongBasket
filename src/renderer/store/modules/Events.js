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
  DOWNLOADED_TRACKS: 0,
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
  downloadFinished ({commit}, tracks) {
    commit('DOWNLOAD_FINISHED', tracks)
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
    state.DOWNLOADED_TRACKS = 0
    state.DOWNLOAD_QUEUE = tracks.map(id => ({
      id, // song id
      state: 'awaiting', // eg: downloading, extracting, applying tags
      ptg: 0 // eg: 36%
    }))
  },
  DOWNLOAD_FINISHED (state, tracks) {
    onDownloadEnd()
  },
  LOADING_EVENT (state, {target, value, ptg}) {
    console.log('EVENT', target, value, ptg)
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
        track.state = 'downloading'
        switch (type[1]) {
          case 'start':
            state.CURRENT_DOWNLOAD = id
            track.ptg = 0
            break
          case 'error':
            // TODO Handle error
            onTrackFinished()
            track.state = 'download_error'
            break
          case 'end':
            track.state = 'download_end'
            break
        }
        break
      case 'extraction':
        track.state = 'extracting'
        switch (type[1]) {
          case 'start':
            track.ptg = 0
            break
          case 'error':
            // TODO Handle error
            onTrackFinished()
            track.state = 'extraction_error'
            break
          case 'end':
            track.state = 'extraction_end'
            break
        }
        break
      case 'tags':
        track.state = 'tags'
        switch (type[1]) {
          case 'start':
            break
          case 'error':
            // TODO Handle error
            track.state = 'tags_error'
            onTrackFinished()
            break
          case 'end':
            onTrackFinished()
            track.state = 'tags_end'
            break
        }
        break
    }
    if (type[1] === 'progress') {
      track.ptg = ptg
      onTrackProgress(ptg / 2 + (type[0] === 'extraction' ? 50 : 0))
    }
  }
}

const onTrackProgress = ptg => {
  ptg = ptg / 100
  // TODO check this func
  const perc = state.LOADING_STATE.ptg + (1 / state.DOWNLOAD_QUEUE.length * ptg) / 100
  console.log(ptg)
  console.log(perc)
  mutations.LOADING_EVENT(null, {target: 'DOWNLOAD', value: true, ptg: perc})
}
const onTrackFinished = () => {
  mutations.LOADING_EVENT(null, {target: 'DOWNLOAD', value: true, ptg: ++state.DOWNLOADED_TRACKS / state.DOWNLOAD_QUEUE.length})
}
const onDownloadEnd = () => {
  mutations.LOADING_EVENT(null, {target: 'DOWNLOAD', value: false, ptg: 1})
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
      return loadingEventTypes.percentable
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
