<template>
  <div class="whole-container">
    <div class="home-container">
      <div class="rel-full" style="height: initial">
        <top-bar/>
        <search-bar/>
      </div>

        <component-loader class="home-router"
        @openPlaylist="openPlaylist($event)"
        @openYtVideo="openYtVideo($event)"
        ></component-loader>

      <floating-buttons style="z-index: 1"
      @youtubeConvert="youtubeConvert"
      ></floating-buttons>
    </div>
  </div>
</template>

<script lang="ts">
import 'vuex'

import TopBar from './TopBar/TopBar.vue'
import SearchBar from './TopBar/SearchBar.vue'
import ComponentLoader from './ComponentLoader.vue'
import PlaylistsList from './PlaylistsList.vue'
import Playlist from './Playlist.vue'
import UserData from './UserData.vue'
import FloatingButtons from './FloatingButtons.vue'
import HomeBackground from './HomeBackground.vue'

export default {
  components: {
    TopBar,
    SearchBar,
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
        this.$IPC.callMain('loadMore')
      }
    },
    openPlaylist (id) {
      console.log(id, this.syncedPlaylists.length, this.playlistSynced(id))
      if (this.playlistSynced(id)) return this.setPlaylistNPush(id)
      this.$IPC.callMain('get tracks from', id)
    },
    setPlaylistNPush (id) {
      this.$sbRouter.push({name: 'playlist-view', params: {id}})
    },
    playlistSynced (id) {
      return this.syncedPlaylists.some(p => p === id)
    },
    youtubeConvert () {
      this.$IPC.callMain('Youtube Convert')
    },
    openYtVideo (id) {
      console.log('openYtVideo', id)
      this.$IPC.callMain('openYtVideo', id)
    }
  },
  mounted () {
    // console.log('USER::::', this.user)

    if (this.$store.state.CurrentUser.playlists.length === 0) { this.$router.push('/empty') }

    this.$IPC.answerMain('done loading', async () => {
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
  transition: padding var(--ts-g);
  padding-top: var(--filters-container-height);
  display: flex;
  box-sizing: border-box;
  overflow: auto;
}

</style>

<style lang="scss" scoped>
// .router-view {
//   $transition: var(--home-transition);
//   transition: transform $transition, opacity $transition;
//   opacity: 1;
//   transform: scale(1);
//   transform-origin: bottom;

//   &.fast {
//     transition: transform 0s
//   }
//   &:not(.release) {
//     transition-timing-function: var(--bezier-out);
//   }
//   &.push {
//     transform: scale(.75);
//     opacity: 0;
//   }
//   &.pull {
//     transform: scale(1.5);
//     opacity: 0;
//   }
//   &.release {
//     opacity: 1;
//     transform: scale(1)
//   }
// }
</style>