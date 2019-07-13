const state = {
  data:{}, //Includes name, number of playlists, image url
  playlists:{},
}

const mutations = {
  UPDATE_USER_DATA(data)
  {
    state.data = data;
  },
  UPDATE_PLAYLISTS(playlists)
  {
    state.playlists = playlists;
  },

}

const actions = {
  updateUserData( { commit, data } ){
    commit('UPDATE_USER_DATA', data )
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
