import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolders: {
        paths: [],
        selected: null
      }
    },
    loadingState: null,
    modal: defaultModal(),
    downloadPool: [],
    CONNECTED_TO_INTERNET: true,
    CONNECTED_TO_API: true
  }
}
function defaultModal () {
  return {
    show: false,
    options: {
      wich: null,
      payload: {}
    }
  }
}
const state = getDefaultState()

const actions = {
  SETUP_LOADING_STATE ({ commit }, loadingState) {
    return new Promise((resolve, reject) => {
      commit('SETUP_LOADING_STATE', loadingState)
      resolve()
    })
  },
  connectionChange ({commit}, value) {
    commit('SET', {key: 'CONNECTED_TO_INTERNET', value})
  },
  apiConnectionChange ({commit}, value) {
    commit('SET', {key: 'CONNECTED_TO_API', value})
  },
  openModal ({commit}, options) {
    return new Promise((resolve, reject) => {
      commit('OPEN_MODAL', options)
      resolve()
    })
  },
  closeModal ({commit}) {
    return new Promise((resolve, reject) => {
      commit('CLOSE_MODAL')
      resolve()
    })
  },
  downloadChunk ({commit}, {id, current, size}) {
    return new Promise((resolve, reject) => {
      commit('DOWNLOAD_CHUNK', {id, current, size})
      resolve()
    })
  }
}

const mutations = {
  TRIGGER (state, key) {
    state[key] = !state[key]
  },
  SET (state, {key, value}) {
    Vue.set(state, key, value)
  },
  SETUP_LOADING_STATE (state, loadingState) {
    state.loadingState = loadingState
  },
  OPEN_MODAL (state, {wich, payload}) {
    state.modal.show = true
    state.modal.options.wich = wich
    state.modal.options.payload = payload
  },
  CLOSE_MODAL (state, options) {
    state.modal.show = false
  },
  DOWNLOAD_CHUNK (state, {id, current, size}) {

  }
}

const getters = {
  // CurrentHomeFolder: (state) => {
  //   console.log('KEKEKEK', state)
  //   return
  // }
}

export default {
  state,
  actions,
  mutations,
  getters
}
