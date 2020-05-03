<template>
  <div class="whole-container">
    <div class="home-container">
      <top-bar
      @refreshPlaylists="refreshPlaylists"
      @youtubeConvert="youtubeConvert"
      @download="download"
      />

        <component-loader class="home-router"
        @openPlaylist="openPlaylist($event)"
        @openYtVideo="openYtVideo($event)"
        ></component-loader>
        <!-- <router-view
        path="playlists-list"
        ></router-view> -->
      <!-- <home-background
      :class="{transitioning: routerAnimation !== 'release'}"
      ></home-background> -->

      <!-- <user-data style="z-index: 1" @logOut="logOut"></user-data> -->
      <floating-buttons style="z-index: 1" @logOut="logOut"
      @refreshPlaylists="refreshPlaylists"
      @youtubeConvert="youtubeConvert"
      @download="download"
      ></floating-buttons>
    </div>
  </div>
</template>

<script>
import 'vuex'

import TopBar from './TopBar/TopBar.vue'
import ComponentLoader from './ComponentLoader.vue'
import PlaylistsList from './PlaylistsList.vue'
import Playlist from './Playlist.vue'
import UserData from './UserData.vue'
import FloatingButtons from './FloatingButtons.vue'
import HomeBackground from './HomeBackground.vue'

export default {
  components: {
    TopBar,
    ComponentLoader,
    PlaylistsList,
    Playlist,
    UserData,
    FloatingButtons,
    HomeBackground
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
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        this.$IPC.send('loadMore')
      }
    },
    openPlaylist (id) {
      console.log(id, this.syncedPlaylists.length, this.playlistSynced(id))
      if (this.playlistSynced(id)) return this.setPlaylistNPush(id)
      this.$IPC.send('get tracks from', id)
    },
    setPlaylistNPush (id) {
      this.$sbRouter.push({name: 'playlist-view', params: {id}})
    },
    logOut () {
      console.log('Logging Out:::::')
      this.$router.push('setup')
      this.$store.dispatch('logout')
    },
    playlistSynced (id) {
      return this.syncedPlaylists.some(p => p === id)
    },
    youtubeConvert () {
      this.$IPC.send('Youtube Convert')
    },
    refreshPlaylists () {
      this.$IPC.send('refreshPlaylists')
    },
    openYtVideo (id) {
      console.log('openYtVideo', id)
      this.$IPC.send('openYtVideo', id)
    },
    download () {
      this.$IPC.send('download')
      this.$sbRouter.push({name: 'downloads-view'})
    }
  },
  mounted () {
    // console.log('USER::::', this.user)
    this.$root.logOut = this.logOut

    if (this.$store.state.CurrentUser.playlists.length === 0) { this.$router.push('/empty') }

    this.$IPC.on('done loading', () => {
      this.loading = false
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
  height: var(--max-container-height);
  overflow: hidden;
  flex-direction: column;
}
.home-router{
  z-index: 1;
  max-height: 100%;
  /* padding-bottom: 1em; */
  display: flex;
  box-sizing: border-box;
  overflow: auto;
}

</style>

<style lang="scss" scoped>
.router-view {
  $transition: var(--home-transition);
  transition: transform $transition, opacity $transition;
  opacity: 1;
  transform: scale(1);
  transform-origin: bottom;

  &.fast {
    transition: transform 0s
  }
  &.push {
    transform: scale(.75);
    opacity: 0;
  }
  &.pull {
    transform: scale(1.5);
    opacity: 0;
  }
  &.release {
    opacity: 1;
    transform: scale(1)
  }
}
</style>