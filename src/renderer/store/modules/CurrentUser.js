import Vuex from 'vuex'
import Vue from 'vue'

const getDefaultState = () => {
  return {
    user: {}, //Includes name, number of playlists, image url
    playlists: [],
    control: {}
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
        console.log('TRACKS SET FOR PLAYLIST WITH ID ' + id)
      }
    
    }
    if(!done) console.log('PLAYLIST NOT FOUND WHEN SETTING TRACKS INSIDE STATE (VUEX)')

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
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
