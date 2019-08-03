import Vuex from 'vuex'
import Vue from 'vue'
import { isNullOrUndefined } from 'util';

const getDefaultState = () => {
  return {
    user: {}, //Includes name, number of playlists, image url
    playlists: [],
    control: {},
    currentPlaylist: ''
  }
}

const state = getDefaultState();

const actions = {
  UPDATE_PLAYLISTS({ commit }, playlists) {
    commit('UPDATE_PLAYLISTS', playlists)
  },
  INIT_USER({ commit }, object) {
    commit('INIT_USER', object);
  },
  CLEAR_USER_N_PLAYLISTS({ commit }) {
    commit('CLEAR_USER_N_PLAYLISTS');
  },
  PLAYLIST_STORE_TRACKS({ commit }, {id, tracks}) {
    console.log({id, tracks})
    commit('PLAYLIST_STORE_TRACKS', {id, tracks});
  },
  SET_CURRENT_PLAYLIST({ commit }, id) {
    return new Promise((resolve, reject) =>{
      commit('SET_CURRENT_PLAYLIST', id);
      resolve();
    })
  }
}

const mutations = {
  INIT_USER(state, object) {
    console.log(`INITIALIZING USER::: ${object.user.id}`)

    state.user = object.user;
    state.user.logged = object.request.logged,
      state.user.SBID = object.request.SBID,

      state.playlists = object.playlists.items;

    state.control = {
      total: object.playlists.total,
      offset: state.playlists.length
    }
  },

  UPDATE_PLAYLISTS(state, playlists) {

    for (let i = 0; i < playlists.items.length; i++) {
      Vue.set(state.playlists, state.playlists.length, playlists.items[i])
    }

    Vue.set(state.control, 'offset', state.playlists.length)

    console.log('PLAYLISTS UPDATE::::::')
  },

  CLEAR_USER_N_PLAYLISTS(state) {
    console.log('CLEARING::::::::');
    Object.assign(state, getDefaultState());
    console.log(state);
  },

  PLAYLIST_STORE_TRACKS(state, {id, tracks}) {
    
    console.log('STORING ' + tracks.length + ' TRACKS FOR PLAYLIST WITH ID ' + id);
    
    let done = false;
    for (let i = 0; i < state.playlists.length; i++) {
      let pl = state.playlists[i]
    
      if (pl.id === id) {
        pl.tracks.items = tracks
        done = true
        console.log('DONE')
      }
    
    }
    if(!done) console.log('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')

  },
  SET_CURRENT_PLAYLIST(state, id){
    console.log('SETTING PLAYLIST WITH ID ' + id + ' AS SELECTED')
    state.currentPlaylist = id
  }

}

const getters = {
  RequestParams: state => {
    return {
      user_id: state.user.id,
      logged: state.user.logged,
      SBID: state.user.SBID,
      control: state.control,
    }
  },
  CurrentPlaylist: (state) => {
      let done = false;
      for (let i = 0; i < state.playlists.length; i++) {
        let pl = state.playlists[i]
      
        if (pl.id === state.currentPlaylist) {
          if(isNullOrUndefined(pl.tracks)) return null
          
          return pl
        }
      
      }
      return null

    }
  }

export default {
  state,
  actions,
  mutations,
  getters
}
