<template>
  <div class="whole-container">
    <div class="home-container">
      <top-bar
      @refreshPlaylists="refreshPlaylists"
      @youtubeConvert="youtubeConvert"
      @download="download"
      />
      
      <router-view
      :class="'router-view ' + animation"
      path="playlists-list"
      @openPlaylist="getTracks($event)"
      @addPlaylistToSyncQueue="addPlaylistToSyncQueue($event)"
      @openYtVideo="openYtVideo($event)"
      ></router-view>

      <user-data @logOut="logOut"></user-data>
    </div>
  </div>
</template>

<script>
import 'vuex'

import TopBar from './TopBar.vue'
import PlaylistsList from './PlaylistsList.vue'
import Playlist from './Playlist.vue'
import UserData from './UserData.vue'

const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  components: {

    TopBar,
    PlaylistsList,
    Playlist,
    UserData
  },
  data () {
    return {
      user: this.$store.state.CurrentUser.user,
      control: this.$store.state.CurrentUser.control,
      loading: false,
      animation: ''
    }
  },
  computed: {
    allLoaded () {
      return this.control.total - this.control.offset <= 0
    },
    syncedPlaylists () {
      return this.$store.state.CurrentUser.syncedPlaylists
    },
    currentPlaylistSet () {
      return this.$store.state.Events.CURRENT_PLAYLIST_SET
    },
    routerAnimation () {
      return this.$store.state.Events.ROUTER_ANIMATION
    }
  },
  watch: {
    currentPlaylistSet () {
      this.$router.push('/home/playlist-view')
    },
    routerAnimation (val) {
      this.animation = val
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        ipc.send('loadMore')
      }
    },
    getTracks (id) {
      if (this.playlistSynced(id)) this.setPlaylistNPush(id)
      else ipc.send('get tracks from', id)
    },
    setPlaylistNPush (id) {
      this.$store.dispatch('setCurrentPlaylist', id)
    },
    logOut () {
      console.log('Logging Out:::::')
      this.$router.push('setup')
      this.$store.dispatch('logout')
    },
    playlistSynced (id) {
      for (let i = 0; i < this.syncedPlaylists.length; i++) {
        if (this.syncedPlaylists[i].id === id) return true
      }
      return false
    },
    addPlaylistToSyncQueue (id) {
      this.$store.dispatch('queuePlaylist', id)
    },
    youtubeConvert () {
      ipc.send('Youtube Convert')
    },
    refreshPlaylists () {
      ipc.send('refreshPlaylists')
    },
    openYtVideo (id) {
      console.log('openYtVideo', id)
      ipc.send('openYtVideo', id)
    },
    download () {
      ipc.send('download')
    }
  },

  mounted () {
    // console.log('USER::::', this.user)

    if (this.$store.state.CurrentUser.playlists.length === 0) { this.$router.push('/empty') }

    ipc.on('done loading', () => {
      this.loading = false
    })

    ipc.on('open playlist', (event, id) => {
      this.setPlaylistNPush(id)
    })
  }
}
</script>

<style>
.whole-container {
  z-index: 0;
}
.home-container {
  z-index: 0;
  position: relative;
  display: flex;
  text-align: center;
  height: 100vh;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
}
.home-router{
  height: 100%;
  padding: 1.5rem 0;
  box-sizing: border-box;
}

</style>

<style lang="scss" scoped>
.router-view {
  $transition: .3s ease;
  transition: transform $transition, opacity $transition;
  opacity: 1;
  transform: scale(1);

  &.out {
    transform-origin: bottom;
    transform: scale(.5);
    opacity: 0;
  }
  &.in {
    transform-origin: bottom;
    transform: scale(1);
    opacity: 1;
  }
}
</style>