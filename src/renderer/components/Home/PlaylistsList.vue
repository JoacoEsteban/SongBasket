<template>
  <div class="home-router pll-container">
    <playlist v-for="playlist in playlists"
    :queued="isQueued(playlist.id)"
    :playlist="playlist"
    :key="playlist.id"
    @addPlaylistToSyncQueue="$emit('addPlaylistToSyncQueue', playlist.id)"
    @openPlaylist="$emit('openPlaylist', playlist.id)" />

    <div v-if="!allLoaded">
      <button class="button" @click="loadMore">{{ loading ? 'Loading' : 'Load More'}}</button>
    </div>
  </div>
</template>

<script>
import Playlist from './Playlist.vue'

const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      user: this.$store.state.CurrentUser.user,
      control: this.$store.state.CurrentUser.control,
      playlists: this.$store.state.CurrentUser.playlists,
      loading: false
    }
  },
  components: {
    Playlist
  },
  computed: {
    allLoaded: function () {
      return this.control.total - this.control.offset <= 0
    },
    queuedPlaylists () {
      return this.$store.state.CurrentUser.queuedPlaylists
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        ipc.send('loadMore')
      }
    },
    isQueued (id) {
      for (let i = 0; i < this.queuedPlaylists.length; i++) {
        if (this.queuedPlaylists[i] === id) return true
      }
      return false
    }
  },
  mounted () {
    ipc.on('done loading', () => {
      this.loading = false
    })
  }
}
</script>

<style>
.pll-container {
  /* margin-bottom: 2.4rem; */
  text-align: center;
  overflow: auto;
}
</style>