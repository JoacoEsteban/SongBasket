// import Vue from 'vue'

const getDefaultState = () => {
  return {
    fileSystem: {
      homeFolders: []
    },
    loadingState: null
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
