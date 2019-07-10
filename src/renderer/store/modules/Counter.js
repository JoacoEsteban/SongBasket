const state = {
  main: 0,
  userData:{}, //Includes name, number of playlists, image url
  playlists:[],
}

const mutations = {
  DECREMENT_MAIN_COUNTER (state) {
    state.main--
  },
  INCREMENT_MAIN_COUNTER (state) {
    state.main++
  }
}

const actions = {
  someAsyncTask ({ commit }) {
    // do something async
    commit('INCREMENT_MAIN_COUNTER')
  },
  updateUserData( { commit, userData } ){
    commit('UPDATE_USER_DATA', userData )
  },
  updatePlaylists( { commit, playlists } ){
    commit('UPDATE_PLAYLISTS', playlists )
  },
}

export default {
  state,
  mutations,
  actions
}
