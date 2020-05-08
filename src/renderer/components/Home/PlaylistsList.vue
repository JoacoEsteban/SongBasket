<template>
  <div ref="playlists-list" class="pll-container">
    <div class="filters-container">
      <div class="filters-content">
        <div class="search-bar global-scroll-shadow">
          <div class="filters-background show-on-scroll">
          </div>
          <input placeholder="Start Typing" autofocus @focus="searchInputOnFocus" @blur="searchInputOnBlur" v-model.trim="searchInput" ref="search-input" class="input-light semibold" type="text" @keydown.enter="handleInputConfirm">
        </div>
        <div class="filter-buttons">

        </div>
      </div>
    </div>
    <div ref="actual-list" class="actual-list row" :class="listAnimationClass" v-if="showList">
      <div v-if="noPlaylists" class="no-playlists">
        No Playlists found{{allLoaded ? '' : ', try loading some more'}}
      </div>
      <div class="horizontal-scroller">
        <playlist v-for="pl in syncedPlaylistsFiltered ? syncedPlaylistsFiltered : syncedPlaylists"
        :playlist="pl.playlist"
        :status="pl.status"
        :key="pl.playlist.id"
        @openPlaylist="$emit('openPlaylist', pl.playlist.id)" />
      </div>
      <div class="list">
        <playlist v-for="pl in unSyncedPlaylistsFiltered ? unSyncedPlaylistsFiltered : unSyncedPlaylists"
        :playlist="pl.playlist"
        :status="pl.status"
        :key="pl.playlist.id"
        @openPlaylist="$emit('openPlaylist', pl.playlist.id)" />
      </div>

      <div class="df aliic jucc col-xs-12 p-0" v-if="!allLoaded">
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
      unSyncedPlaylistsFiltered: null,
      playlists: [],
      showList: true,
      scrollOpKeys: {
        kebab: 'scroll-opacity',
        camel: this.$camelcase('scroll-opacity')
      }
    }
  },
  components: {
    Playlist
  },
  computed: {
    allLoaded () {
      return this.control.total - this.control.offset <= 0
    },
    unSyncedPlaylists () {
      return this.playlists.filter(pl => !this.$store.getters.PlaylistIsSynced(pl.id)).map(this.formatPlaylist)
    },
    stateReplaced () {
      return this.$store.state.Events.STATE_REPLACED
    },
    playlistTracksReComputed () {
      return this.$store.state.Events.PLAYLIST_TRACKS_RE_COMPUTED
    },
    playlistStateChanged () {
      return this.$store.state.Events.PLAYLIST_STATE_CHANGED
    }
  },
  watch: {
    stateReplaced () {
      this.refreshAll()
    },
    playlistTracksReComputed () {
      this.refreshSynced()
    },
    searchInput (val) {
      this.filterPlaylists()
    },
    playlistStateChanged () {
      this.refreshAll()
    }
  },
  methods: {
    formatPlaylist (playlist) {
      return ({
        playlist,
        status: this.$controllers.playlist.getStatus(playlist)
      })
    },
    loadMore () {
      this.$controllers.core.loadMorePlaylists()
    },
    searchInputOnFocus () {
      this.$root.searchInputElement = null
    },
    searchInputOnBlur () {
      this.$root.searchInputElement = this.$refs['search-input']
    },
    handleInputConfirm () {
      if (this.syncedPlaylistsFiltered && this.syncedPlaylistsFiltered.length === 1) {
        const pl = this.$children.find(p => p.playlistId === this.syncedPlaylistsFiltered[0].id)
        pl && pl.handleClick()
      }
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
    refreshAll () {
      this.playlists = this.$store.state.CurrentUser.playlists
      this.refreshSynced()
    },
    refreshSynced () {
      this.syncedPlaylists = this.$store.state.CurrentUser.syncedPlaylists.map(id => this.playlists.find(pl => pl.id === id)).filter(pl => pl).map(this.formatPlaylist).sort(this.$controllers.playlist.sort)

      this.filterPlaylists()
    },
    calcScrollOpacity () {
      let ratio = (this.getContainerElement().scrollTop / 100)
      if (ratio > 1) ratio = 1
      this.$setRootVar(this.scrollOpKeys, (this.filterBackgroundOpacity = ratio))
    },
    getContainerElement () {
      return (this.containerElement || (this.containerElement = this.$root.$refs['home-router']))
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
              (this.syncedPlaylistsFiltered = this.syncedPlaylists.filter(({playlist}) => playlist.name.toLowerCase().includes(txt))).length +
              (this.unSyncedPlaylistsFiltered = this.unSyncedPlaylists.filter(({playlist}) => playlist.name.toLowerCase().includes(txt))).length
            ) === 0
          }
          this.noPlaylists = noPlaylists
        })
      this.lastType = setTimeout(this.showPlaylists, this.listAnimationTime + 10)
    }
  },
  beforeDestroy () {
    this.searchInputOnFocus()
  },
  mounted () {
    this.searchInputOnBlur()
    this.$IPC.on('done loading', () => {
      this.loading = false
    })
    this.refreshAll()
    this.$refs['actual-list'].style.setProperty('--list-transition-time', this.listAnimationTime + 'ms')
    this.$root.plListEnv = this
    this.$root.onComponentLoaderMount = function () {
      console.log('dousinho')
      const env = this.$root.plListEnv
      this.$(env.getContainerElement()).on('scroll', env.calcScrollOpacity)
      env.calcScrollOpacity()
    }
  }
}
</script>

<style lang="scss" scoped>
$bezier: cubic-bezier(0, 1, 0, 1);
$bezier-chill: cubic-bezier(0, 1, .5, 1);

.pll-container {
  --padding-x: var(--container-padding-x);
  /* margin-bottom: 2.4rem; */
  text-align: center;
  height: fit-content;
  width: 100%;
  box-sizing: border-box;
  padding: var(--container-padding-x) 0;
  padding-top: 0;
}
.actual-list {
  // TODO Adapt transition to global trasition scale factor
  --list-transition-time: .3s;
  $transition: var(--list-transition-time) $bezier-chill;
  transition: transform $transition, opacity $transition;
  &.hide {
    transform: translateX(-3em);
    opacity: 0;
  }
  > .list {
    padding: 0 var(--padding-x);
  }
}
.filters-container {
  pointer-events: none;
  padding: .5em;
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
    // padding: 0 1em;
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