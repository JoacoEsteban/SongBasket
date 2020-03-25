import FSController from '../../../main/controllers/FileSystem/index'
// import Vue from 'vue'

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
  addHomeFolder ({ commit }, path) {
    return new Promise((resolve, reject) => {
      commit('ADD_HOME_FOLDER', path)
      resolve()
    })
  },
  setFolderPaths ({commit}, paths) {
    return new Promise((resolve, reject) => {
      commit('SET_FOLDER_PATHS', paths)
      resolve()
    })
  },
  SET_LOADING_STATE ({ commit }, loadingState) {
    return new Promise((resolve, reject) => {
      commit('SET_LOADING_STATE', loadingState)
      resolve()
    })
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
  initializeDownloadPool ({commit}) {
    return new Promise((resolve, reject) => {
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
  ADD_HOME_FOLDER (state, path) {
    console.log('goldys', state.fileSystem.homeFolders)
    if (!state.fileSystem.homeFolders.paths.some(p => p === path)) state.fileSystem.homeFolders.paths.push(path)
    state.fileSystem.homeFolders.selected = path
    global.HOME_FOLDER = path
    console.log('HOME FOLDER ADDED', global.HOME_FOLDER)
    FSController.UserMethods.writeHomeFolders(state.fileSystem.homeFolders)
  },
  SET_FOLDER_PATHS (state, FOLDERS) {
    console.log('SETTIN', FOLDERS)
    state.fileSystem.homeFolders = FOLDERS
    global.HOME_FOLDER = FOLDERS.selected
    FSController.UserMethods.writeHomeFolders(state.fileSystem.homeFolders)
  },
  SET_LOADING_STATE (state, loadingState) {
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
