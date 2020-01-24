<template>
  <div ref="playlists-list" class="home-router pll-container">
    <div class="filters-container">
      <div class="filters-background" :style="{opacity: 1 - filterBackgroundOpacity}">
      </div>
      <div class="filters-content">
        <div class="search-bar">
          <div class="filters-background" :style="{opacity: filterBackgroundOpacity}">
          </div>
          <span class="label">
            filter
          </span>
          <input class="input-light" type="text">
        </div>
        <div class="filter-buttons">

        </div>
      </div>
    </div>
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
      loading: false,
      filterBackgroundOpacity: 0,
      syncedPlaylists: []
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
    unSyncedPlaylists () {
      return this.playlists.filter(pl => !this.$store.getters.PlaylistIsSynced(pl.id))
    },
    syncedPlaylistsRefreshed () {
      return this.$store.state.Events.SYNCED_PLAYLISTS_REFRESHED
    }
  },
  watch: {
    syncedPlaylistsRefreshed () {
      this.refreshSynced()
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        ipc.send('loadMore')
      }
    },
    refreshSynced () {
      let all = []
      let pls = [...this.$store.state.CurrentUser.playlists]
      for (let i = 0; i < this.$store.state.CurrentUser.syncedPlaylists.length; i++) {
        let syncPl = this.$store.state.CurrentUser.syncedPlaylists[i]
        for (let o = 0; o < pls.length; o++) {
          let pl = pls[o]
          if (pl.id === syncPl) {
            all = [...all, pl]
            pls.splice(o, 1)
            break
          }
        }
      }
      this.syncedPlaylists = all
    }
  },
  mounted () {
    ipc.on('done loading', () => {
      this.loading = false
    })
    this.refreshSynced()

    const containerElement = this.$refs['playlists-list']
    containerElement.addEventListener('scroll', (e) => {
      let ratio
      if ((ratio = (containerElement.scrollTop / 100)) > 1) ratio = 1
      this.filterBackgroundOpacity = ratio
    })
  }
}
</script>

<style lang="scss" scoped>
.pll-container {
  /* margin-bottom: 2.4rem; */
  text-align: center;
  overflow: auto;
}
.filters-container {
  pointer-events: none;
  padding: .5em 0;
  margin-bottom: 1em;
  position: sticky;
  top: 0;
  z-index: 1;
  .filters-background {
    background: linear-gradient(180deg, var(--global-grey), transparent);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }
  .filters-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
  }
  .search-bar {
    pointer-events: all;
    .filters-background {
      background: var(--global-grey);
    }
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    border-radius: 10em;
    padding-left: 1em;
    padding-right: .2em;
  }
}
</style>