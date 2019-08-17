<template>
  <div>
    <div class="home-container">
      <top-bar/>
      
      <router-view @openPlaylist="getTracks($event)" path="playlists-list"></router-view>

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
      loading: false
    }
  },
  computed: {
    allLoaded: function () {
      return this.control.total - this.control.offset <= 0
    },
    cachedPlaylists: function () {
      return this.$store.state.CurrentUser.cachedPlaylists
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
      if (this.playlistCached(id)) this.setPlaylistNPush(id)
      else ipc.send('get tracks from', id)
    },
    setPlaylistNPush (id) {
      this.$store.dispatch('SET_CURRENT_PLAYLIST', id)
      // .then( () => )
      this.$router.push('/home/playlist-view')
    },
    logOut () {
      console.log('DESTROYING:::::')
      this.$router.push('setup')
      this.$store.dispatch('CLEAR_USER_N_PLAYLISTS')
    },
    playlistCached (id) {
      for (let i = 0; i < this.cachedPlaylists.length; i++) {
        if (this.cachedPlaylists[i].id === id) return true
      }
      return false
    }

  },

  mounted () {
    console.log('USER::::', this.user)

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
