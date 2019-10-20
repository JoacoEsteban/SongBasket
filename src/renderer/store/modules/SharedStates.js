// import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolders: []
    },
    loadingState: null,
    modal: defaultModal(),
    downloadPool: []
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
  setHomeFolder ({ commit }, path) {
    commit('SET_HOME_FOLDER', path)
  },
  SET_LOADING_STATE ({ commit }, loadingState) {
    commit('SET_LOADING_STATE', loadingState)
  },
  folderPaths ({commit}, paths) {
    commit('FOLDER_PATHS', paths)
  },
  openModal ({commit}, options) {
    console.log('didid')
    commit('OPEN_MODAL', options)
  },
  closeModal ({commit}) {
    commit('CLOSE_MODAL')
  },
  initializeDownloadPool ({commit}) {
  },
  downloadChunk ({commit}, {id, current, size}) {
    commit('DOWNLOAD_CHUNK', {id, current, size})
  }
}

const mutations = {
  SET_HOME_FOLDER (state, path) {
    if (!state.fileSystem.homeFolders) state.fileSystem.homeFolders = [{path, current: true}]

    for (let i = 0; i < state.fileSystem.homeFolders.length; i++) {
      let path = state.fileSystem.homeFolders[i]
      path.current = false
    }
    process.env.HOME_FOLDER = path
    console.log('HOME FOLDER SET', process.env.HOME_FOLDER)
    state.fileSystem.homeFolders = [...state.fileSystem.homeFolders, {path, current: true}]
  },
  SET_LOADING_STATE (state, loadingState) {
    state.loadingState = loadingState
  },
  FOLDER_PATHS (state, paths) {
    state.fileSystem.homeFolders = paths
  },
  OPEN_MODAL (state, {wich, payload}) {
    console.log('didid')
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
