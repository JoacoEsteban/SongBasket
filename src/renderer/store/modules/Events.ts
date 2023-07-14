import Vue from 'vue'
import VueInstance from '../../main'
import { ActionContext } from 'vuex'
import { DownloadStartedEventPayload } from '../../../main/controllers/DownloadPhase/youtube-dl'


type TriggerableProp =
  'CURRENT_PLAYLIST_SET' |
  'FFMPEG_BINS_DOWNLOADED' |
  'STATE_REPLACED' |
  'PLAYLIST_UNSYNCED' |
  'RESET_SELECTION' |
  'PLAYLIST_TRACKS_RE_COMPUTED' |
  'PLAYLIST_STATE_CHANGED' // TODO turn this into an enum

type LoadingEventTarget = 'PLAYLISTS:REFRESH' | 'YOUTUBIZE' | 'DOWNLOAD' | 'PLAYLIST:UNSYNC' | '' // TODO turn this into an enum

type LoadingEvent = {
  value: boolean
  target: LoadingEventTarget
  showPtg: boolean
  ptg: number | null
  message: string
}
interface EventsState {
  CURRENT_PLAYLIST_SET: boolean
  FFMPEG_BINS_DOWNLOADED: boolean
  STATE_REPLACED: boolean
  PLAYLIST_UNSYNCED: boolean
  RESET_SELECTION: boolean
  PLAYLIST_TRACKS_RE_COMPUTED: boolean
  PLAYLIST_STATE_CHANGED: boolean
  // 
  ROUTER_ANIMATION: string
  LOADING_STATE: LoadingEvent,
  DOWNLOADED_TRACKS: number
  DOWNLOAD_QUEUE: {
    id: string
    state: string
    ptg: number
  }[]
  CURRENT_DOWNLOAD: string | null
  GLOBAL_ERROR: {
    message: string
  } | null
}

const getDefaultState: () => EventsState = () => ({
  CURRENT_PLAYLIST_SET: false,
  FFMPEG_BINS_DOWNLOADED: false,
  STATE_REPLACED: false,
  PLAYLIST_UNSYNCED: false,
  RESET_SELECTION: false,
  PLAYLIST_TRACKS_RE_COMPUTED: false,
  PLAYLIST_STATE_CHANGED: false,
  ROUTER_ANIMATION: '',
  LOADING_STATE: loadingEventTypes.default,
  DOWNLOADED_TRACKS: 0,
  DOWNLOAD_QUEUE: [],
  CURRENT_DOWNLOAD: null, // id from current download
  GLOBAL_ERROR: null
})


const actions: {
  [key: string]: (context: ActionContext<EventsState, any>, payload?: any) => Promise<void> | void
} = {
  trigger ({ commit }, key) {
    commit('TRIGGER', window.changeCase.constantCase(key))
  },
  currentPlaylistSet ({ commit }) {
    commit('TRIGGER', 'CURRENT_PLAYLIST_SET')
  },
  ffmpegBinsDownloaded ({ commit }, value) {
    commit('SET', { key: 'FFMPEG_BINS_DOWNLOADED', value })
  },
  stateReplaced ({ commit }) {
    commit('TRIGGER', 'STATE_REPLACED')
  },
  playlistUnsynced ({ commit }) {
    commit('TRIGGER', 'PLAYLIST_UNSYNCED')
  },
  resetSelection ({ commit }) {
    commit('TRIGGER', 'RESET_SELECTION')
  },
  reComputeConvertedTracks ({ commit }) {
    // commit('TRIGGER', 'PLAYLIST_TRACKS_RE_COMPUTED')
    VueInstance.$controllers.core.formatConvertedTracks()
  },
  playlistTracksReComputed ({ commit }) {
    commit('TRIGGER', 'PLAYLIST_TRACKS_RE_COMPUTED')
  },
  playlistStateChanged ({ commit }) {
    commit('TRIGGER', 'PLAYLIST_STATE_CHANGED')
  },
  routerAnimation ({ commit }, animation) {
    commit('SET', { key: 'ROUTER_ANIMATION', value: animation })
  },
  downloadStarted ({ commit }, tracks: DownloadStartedEventPayload) { // TODO typecheck payload
    commit('DOWNLOAD_STARTED', tracks)
  },
  async downloadFinished ({ commit }, tracks) {
    try {
      commit('DOWNLOAD_FINISHED', tracks)
    } catch (error) {
      throw error
    }
  },
  downloadEvent ({ commit }, params) {
    commit('DOWNLOAD_EVENT', params)
  },
  loadingEvent ({ commit }, payload) {
    commit('LOADING_EVENT', payload)
  },
  catchGlobalError ({ commit }, { type, error }) {
    return new Promise((resolve, reject) => {
      commit('CATCH_GLOBAL_ERROR', { type, error })
      resolve()
    })
  }
}

const SET = (key: keyof EventsState, value: any) => Vue.set(state, key, value) // TODO type

const mutations: {
  [key: string]: (state: EventsState, payload?: any) => void
} = {
  TRIGGER (state, key: TriggerableProp) {
    state[key] = !state[key]
  },
  SET (state, { key, value }) {
    SET(key, value)
  },
  DOWNLOAD_STARTED (state, tracks: DownloadStartedEventPayload) {
    state.DOWNLOADED_TRACKS = 0
    state.DOWNLOAD_QUEUE = tracks.map(({ id, info }) => {
      (info.finished || info.currentStatus.includes('error')) && ++state.DOWNLOADED_TRACKS
      return {
        id, // song id
        state: info.currentStatus,
        ptg: (info.currentStatus.includes('ing') && info.ptg) || 0
      }
    })
    state.LOADING_STATE.ptg = 1 / tracks.length * state.DOWNLOADED_TRACKS
  },
  DOWNLOAD_FINISHED (state, tracks) {
    onDownloadEnd()
  },
  LOADING_EVENT (state, { target, value, ptg }) {
    const formatted = getLoadingEvent(target)
    formatted.target = target
    formatted.value = value
    formatted.ptg = ptg || 0
    SET('LOADING_STATE', formatted)
  },
  DOWNLOAD_EVENT (state, { id, ptg, type }) {
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
  },
  CATCH_GLOBAL_ERROR (state, { type, error }) {
    SET('GLOBAL_ERROR', getErrorType(type, error))
  }
}

const onTrackProgress = ptg => {
  // TODO check this func
  console.log('progress')
  mutations.LOADING_EVENT(null, { target: 'DOWNLOAD', value: true, ptg: (state.DOWNLOADED_TRACKS / state.DOWNLOAD_QUEUE.length) + (1 / state.DOWNLOAD_QUEUE.length) * (ptg * 0.01) })
}
const onTrackFinished = () => {
  console.log('track finished')
  // TODO better solution
  if (!state.LOADING_STATE.value) return
  mutations.LOADING_EVENT(null, { target: 'DOWNLOAD', value: true, ptg: ++state.DOWNLOADED_TRACKS / state.DOWNLOAD_QUEUE.length })
}
const onDownloadEnd = () => {
  console.log('download end')
  mutations.LOADING_EVENT(null, { target: 'DOWNLOAD', value: false, ptg: 1 })
}

const loadingEventTypes: {
  messages: {
    [key: string]: string
  },
  defaultMessage: (env: LoadingEvent) => string
  default: LoadingEvent
  percentable: LoadingEvent
} = {
  messages: {
    'PLAYLISTS:REFRESH': 'Updating Playlists',
    'YOUTUBIZE': 'Converting Tracks',
    'DOWNLOAD': 'Downloading Tracks',
    'PLAYLIST:UNSYNC': 'Unsyncing Playlist',
    default: 'Loading'
  },
  defaultMessage (env) {
    return this.messages[env.target] || this.messages.default
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
    } as LoadingEvent
  },
  get percentable () {
    return {
      value: false,
      target: '' as LoadingEventTarget,
      showPtg: true,
      ptg: 0,
      get message () {
        return loadingEventTypes.defaultMessage(this) + ' ' + (this.ptg * 100).toFixed(1) + '%'
      }
    }
  }
}

function getLoadingEvent (target: LoadingEventTarget) {
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

function getErrorType (type: string, error: Error) { // TODO typecheck
  switch (type) {
    // case 'PLAYLISTS:REFRESH':
    default:
      return {
        message: 'Something went wrong. Try again later or contact support at <a href="mailto:help@songbasket.com">help@songbasket.com</a>'
      }
  }
}

const state = getDefaultState()

export default {
  state,
  actions,
  mutations
}
