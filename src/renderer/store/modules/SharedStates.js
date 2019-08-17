// import Vue from 'vue'

const state = {
  loadingState: null
}

const actions = {
  SET_LOADING_STATE ({ commit }, loadingState) {
    commit('SET_LOADING_STATE', loadingState)
  }
}

const mutations = {
  SET_LOADING_STATE (state, loadingState) {
    state.loadingState = loadingState
  }
}

export default {
  state,
  actions,
  mutations
}
