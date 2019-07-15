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
  UPDATE_PLAYLISTS( { commit, playlists } ){
    commit('UPDATE_PLAYLISTS', playlists )
  },
  INIT_USER( { commit }, object  ){
    commit('INIT_USER', object);
  },
  CLEAR_USER_N_PLAYLISTS( { commit } ){
    commit('CLEAR_USER_N_PLAYLISTS');
  }
}

const mutations = {
  INIT_USER(state, object)
  {
    console.log(`INITIALIZING USER::: ${object.user.id}`)

    state.user = object.user;
    state.playlists = object.playlists.items;
    
    state.control = {
      total: object.playlists.total,
      loaded: state.playlists.length,
      offset: object.playlists.offset,
    }
  },

  UPDATE_PLAYLISTS(state, playlists)
  {
    state.playlists = [...state.playlists, ...playlists.items];
    console.log('PLAYLISTS UPDATE::::::', state.playlists)
  },
  
  CLEAR_USER_N_PLAYLISTS(state)
  {
    console.log('CLEARING::::::::');
    Object.assign(state, getDefaultState());
    console.log(state);
  }

}

const getters = {
  getMorePlaylistsData: state =>
  {
    return {
      user_id: state.user.id,
      logged: state.user.logged,
      SBID: state.user.SBID,
      control: state.control,
    }
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
