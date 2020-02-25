<template>
  <div ref="playlists-list" class="home-router pll-container">
    <div class="filters-container">
      <div class="filters-background" :style="{opacity: 1 - filterBackgroundOpacity}">
      </div>
      <div class="filters-content">
        <div class="search-bar">
          <div class="filters-background" :style="{opacity: filterBackgroundOpacity}">
          </div>
          <!-- <span class="label">
            filter
          </span> -->
          <input placeholder="Start Typing" autofocus @focus="searchInputOnFocus" @blur="searchInputOnBlur" v-model.trim="searchInput" ref="search-input" class="input-light semibold" type="text">
        </div>
        <div class="filter-buttons">

        </div>
      </div>
    </div>
    <div ref="actual-list" class="actual-list" :class="listAnimationClass">
      <div v-if="noPlaylists" class="no-playlists">
        No Playlists found{{allLoaded ? '' : ', try loading some more'}}
      </div>
      <playlist v-for="playlist in syncedPlaylistsFiltered ? syncedPlaylistsFiltered : syncedPlaylists"
      :playlist="playlist"
      :key="playlist.id"
      @addPlaylistToSyncQueue="$emit('addPlaylistToSyncQueue', playlist.id)"
      @openPlaylist="$emit('openPlaylist', playlist.id)" />
      <playlist v-for="playlist in unSyncedPlaylistsFiltered ? unSyncedPlaylistsFiltered : unSyncedPlaylists"
      :playlist="playlist"
      :key="playlist.id"
      @addPlaylistToSyncQueue="$emit('addPlaylistToSyncQueue', playlist.id)"
      @openPlaylist="$emit('openPlaylist', playlist.id)" />

      <div v-if="!allLoaded">
        <button class="button" @click="loadMore">{{ loading ? 'Loading' : 'Load More'}}</button>
      </div>
    </div>
    <!-- <div class="background-container">
      dalebro
    </div> -->
  </div>
</template>

<script>
import Playlist from './Playlist.vue'

export default {
  data () {
    return {
      user: this.$store.state.CurrentUser.user,
      control: this.$store.state.CurrentUser.control,
      loading: false,
      transitioning: false,
      noPlaylists: false,
      filterBackgroundOpacity: 0,
      listAnimationTime: 250,
      listAnimationClass: '',
      searchInput: '',
      syncedPlaylists: [],
      syncedPlaylistsFiltered: null,
      unSyncedPlaylistsFiltered: null
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
    },
    searchInput (val) {
      this.filterPlaylists()
    }
  },
  methods: {
    loadMore () {
      if (!this.loading) {
        this.loading = true
        window.ipc.send('loadMore')
      }
    },
    searchInputOnFocus () {
      this.$root.searchInputElement = null
    },
    searchInputOnBlur () {
      this.$root.searchInputElement = this.$refs['search-input']
    },
    transitionPlaylists (what) {
      return new Promise((resolve, reject) => {
        // if (this.transitioning) resolve(false)
        this.transitioning = true
        this.listAnimationClass = what
        setTimeout(() => {
          resolve(!(this.transitioning = false))
        }, this.listAnimationTime)
      })
    },
    hidePlaylists () {
      return new Promise((resolve, reject) => {
        this.transitionPlaylists('hide')
          .then(res => resolve(res))
          .catch(err => reject(err))
      })
    },
    showPlaylists () {
      return new Promise((resolve, reject) => {
        this.transitionPlaylists('show')
          .then(res => resolve(res))
          .catch(err => reject(err))
      })
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
      this.filterPlaylists()
    },
    filterPlaylists () {
      if (this.lastType) clearTimeout(this.lastType)
      this.hidePlaylists()
        .then(() => {
          let txt = this.searchInput.toLowerCase()
          let noPlaylists = false
          if (!txt.length) {
            this.unSyncedPlaylistsFiltered = null
            this.syncedPlaylistsFiltered = null
          } else {
            noPlaylists = (
              (this.syncedPlaylistsFiltered = this.syncedPlaylists.filter(pl => pl.name.toLowerCase().includes(txt))).length +
              (this.unSyncedPlaylistsFiltered = this.unSyncedPlaylists.filter(pl => pl.name.toLowerCase().includes(txt))).length
            ) === 0
          }
          this.noPlaylists = noPlaylists
        })
      this.lastType = setTimeout(() => {
        this.showPlaylists()
      }, this.listAnimationTime + 10)
    }
  },
  beforeDestroy () {
    this.searchInputOnFocus()
  },
  mounted () {
    this.searchInputOnBlur()
    window.ipc.on('done loading', () => {
      this.loading = false
    })
    this.refreshSynced()
    this.$refs['actual-list'].style.setProperty('--list-transition-time', this.listAnimationTime + 'ms')

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
$bezier: cubic-bezier(0, 1, 0, 1);
$bezier-chill: cubic-bezier(0, 1, .5, 1);
$transition-global: 0.5s $bezier-chill;
$transition-global-hard: 0.5s $bezier;

.pll-container {
  /* margin-bottom: 2.4rem; */
  text-align: center;
  overflow: auto;
}
.actual-list {
  --list-transition-time: .3s;
  $transition: var(--list-transition-time) $bezier-chill;
  transition: transform $transition, opacity $transition;
  &.hide {
    transform: translateX(-3em);
    opacity: 0;
  }
}
.filters-container {
  pointer-events: none;
  padding: .5em 0;
  margin-bottom: 1em;
  position: sticky;
  top: 0;
  z-index: 1;
  .filters-background {
    background: linear-gradient(180deg, var(--global-grey-secondary), transparent);
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
      background: var(--global-grey-secondary);
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
.no-playlists {
  margin: 4em 0;
}
.background-container {
  position: sticky;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>