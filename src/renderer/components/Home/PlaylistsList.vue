<template>
  <div class="home-router pll-container">
    <playlist v-for="playlist in syncedPlaylists"
    :playlist="playlist"
    :key="playlist.id"
    @addPlaylistToSyncQueue="$emit('addPlaylistToSyncQueue', playlist.id)"
    @openPlaylist="$emit('openPlaylist', playlist.id)" />
    <playlist v-for="playlist in unSyncedPlaylists"
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
      loading: false
    }
  },
  components: {
    Playlist
  },
  computed: {
    allLoaded () {
      return this.control.total - this.control.offset <= 0
    },
    playlists () {
      return this.$store.state.CurrentUser.playlists
    },
    syncedPlaylists () {
      let sync = this.$store.state.CurrentUser.syncedPlaylists
      return sync.map(pl => this.$store.getters.PlaylistById(pl.id))
    },
    unSyncedPlaylists () {
      return this.playlists.filter(pl => !this.$store.getters.PlaylistIsSynced(pl.id))
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        ipc.send('loadMore')
      }
    },
    mounted () {
      ipc.on('done loading', () => {
        this.loading = false
      })
    }
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