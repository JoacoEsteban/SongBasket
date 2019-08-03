<template>
  <div>
    <div class="home-container">
      <top-bar></top-bar>

      <!-- TODO Change into a router view. Enables changing middle section between the playlist list and the playlist view -->
      <router-view path="playlists-list"></router-view>
      <!-- <playlists-list> </playlists-list > -->

      <user-data @logOut="logOut"></user-data>
    </div>
    <!-- <empty v-if="!playlists.length" /> -->
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
import Empty from "./Empty.vue";

export default {
  components: {
    TopBar,
    PlaylistsList,
    Playlist,
    UserData,
    Empty
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
    logOut() {
      console.log("DESTROYING:::::");
      this.$router.push("/");
      this.$store.dispatch("CLEAR_USER_N_PLAYLISTS");
    }
  },

  mounted() {
    console.log("USER::::", this.user);

    ipc.on("done loading", () => {
      this.loading = false;
    });



    ipc.on("open playlist", (event, id) => {
      console.log("TRACKS LOADED FOM PL WITH ID ", id);
      this.$router.push({ name: "playlist-view", id: id });
    });
  }
};
</script>

<style>
.home-container {
  text-align: center;
}
.home-playlists-container {
  margin-bottom: 2.4rem;
  text-align: center;
}
</style>
