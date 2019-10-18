// import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolders: []
    },
    loadingState: null,
    modal: defaultModal()
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
    commit('OPEN_MODAL', options)
  },
  closeModal ({commit}) {
    commit('CLOSE_MODAL')
  }
}

const mutations = {
  SET_HOME_FOLDER (state, path) {
    if (!state.fileSystem.homeFolders) state.fileSystem.homeFolders = [{path, current: true}]

    for (let i = 0; i < state.fileSystem.homeFolders.length; i++) {
      let path = state.fileSystem.homeFolders[i]
      path.current = false
    }
    state.fileSystem.homeFolders = [...state.fileSystem.homeFolders, {path, current: true}]
  },
  SET_LOADING_STATE (state, loadingState) {
    state.loadingState = loadingState
  },
  FOLDER_PATHS (state, paths) {
    state.fileSystem.homeFolders = paths
  },
  OPEN_MODAL (state, {wich, payload}) {
    state.modal.show = true
    state.modal.options.wich = wich
    state.modal.options.payload = payload
  },
  CLOSE_MODAL (state, options) {
    state.modal.show = false
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
