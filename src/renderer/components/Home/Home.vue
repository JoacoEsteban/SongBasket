<template>
  <div>
    <div class="home-container">
      <top-bar></top-bar>
      
      <router-view @openPlaylist="getTracks($event)" path="playlists-list"></router-view>

      <user-data @logOut="logOut"></user-data>
    </div>
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;

import "vuex";

import TopBar from "./TopBar.vue";
import PlaylistsList from "./PlaylistsList.vue";
import Playlist from "./Playlist.vue";
import UserData from "./UserData.vue";

export default {
  components: {
    TopBar,
    PlaylistsList,
    Playlist,
    UserData,
  },
  data() {
    return {
      user: this.$store.state.CurrentUser.user,
      control: this.$store.state.CurrentUser.control,
      loading: false
    };
  },
  computed: {
    allLoaded: function() {
      return this.control.total - this.control.offset <= 0;
    }
  },

  methods: {
    loadMore() {
      if (!this.loading) {
        this.loading = true;
        ipc.send("loadMore");
      }
    },
     getTracks(id){
       ipc.send('get tracks from', id)
       },

    logOut() {
      console.log("DESTROYING:::::");
      this.$router.push("/");
      this.$store.dispatch("CLEAR_USER_N_PLAYLISTS");
    }
  },

  mounted() {
    console.log("USER::::", this.user);

    if (this.$store.state.CurrentUser.playlists.length === 0)
      this.$router.push("/empty");

    ipc.on("done loading", () => {
      this.loading = false;
    });

    ipc.on("open playlist", (event, id) => {
      this.$store.dispatch('SET_CURRENT_PLAYLIST', id)
      // .then( () => )
      this.$router.push('/home/playlist-view');
    });
  }
};
</script>

<style>
.home-container {
  display: flex;
  text-align: center;
  height: 100vh;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
}
.home-router{
  height: 100%;
  padding: 1rem 0;
  box-sizing: border-box;
}

</style>
