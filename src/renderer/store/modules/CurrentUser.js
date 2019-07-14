import { logme } from "../../../UTILS";

const getDefaultState = () => {
  return {
    user:{}, //Includes name, number of playlists, image url
    playlists:[],
    control:{}
  }
}

const state = getDefaultState();

const actions = {
  updateUserData( { commit, user } ){
    commit('UPDATE_USER_DATA', user )
  },
  updatePlaylists( { commit, playlists } ){
    commit('UPDATE_PLAYLISTS', playlists )
  },
  UPDATE_USER_N_PLAYLISTS( { commit }, object  ){
    commit('UPDATE_USER_N_PLAYLISTS', object);
  },
  CLEAR_USER_N_PLAYLISTS( { commit } ){
    commit('CLEAR_USER_N_PLAYLISTS');
  }
}

const mutations = {
  UPDATE_USER_N_PLAYLISTS(state, object)
  {
    console.log('UPDATING USER:::' , object.playlists.items)
    state.user = object.user;
    state.playlists = [...state.playlists , ...object.playlists.items];
    state.control = {
      total: object.playlists.total,
      current: state.playlists.length,
      offset: object.playlists.offset,
    }
  },
  UPDATE_USER_DATA(state, user)
  {
    state.user = user;
  },
  UPDATE_PLAYLISTS(state, playlists)
  {
    state.playlists = playlists;
    console.log('PLAYLISTS UPDATE::::::', state.playlists)
  },
  CLEAR_USER_N_PLAYLISTS(state)
  {
    console.log('CLEARING::::::::');
    Object.assign(state, getDefaultState());
    console.log(state);
  }

}

export default {
  state,
  mutations,
  actions,
}
