<template>
  <div class="home-playlists-container">
    <playlist v-for="playlist in playlists" :playlist="playlist" :key="playlist.id"
    @openPlaylist="$emit('openPlaylist', playlist.id)" />

    <div v-if="!allLoaded">
      <button class="button" @click="loadMore">{{ loading ? 'Loading' : 'Load More'}}</button>
    </div>
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;

import Playlist from "./Playlist.vue";

export default {
  data() {
    return {
      user: this.$store.state.CurrentUser.user,
      control: this.$store.state.CurrentUser.control,
      playlists: this.$store.state.CurrentUser.playlists,
      loading: false
    };
  },
  components: {
    Playlist
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
    }
  },
  mounted() {
    ipc.on("done loading", () => {
      this.loading = false;
    });
  }
};
</script>

<style>
</style>