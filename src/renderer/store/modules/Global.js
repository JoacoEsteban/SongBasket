const state = {
  userData:{}, //Includes name, number of playlists, image url
  playlists:[],
}

const mutations = {


}

const actions = {
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
