<template>
  <div ref="tracks-list" class="tkl-container">
    <div ref="actual-list" class="actual-list row hideable-container" :class="listAnimationClass">
      <div v-if="noTracks" class="no-tracks">
        No Tracks found
      </div>
      <div class="list row">
        <Track v-for="track in tracksFiltered ? tracksFiltered : tracks"
        :item="track"
        :key="track.id"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Track from './PlaylistView/Track.vue'

export default {
  data () {
    return {
      user: this.$store.state.CurrentUser.user,
      loading: false,
      transitioning: false,
      noTracks: false,
      filterBackgroundOpacity: 0,
      listAnimationTime: 250,
      listAnimationClass: '',
      tracks: [],
      tracksFiltered: null,
      filterMap: {},
      scrollOpKeys: {
        kebab: 'scroll-opacity',
        camel: this.$camelcase('scroll-opacity')
      }
    }
  },
  components: {
    Track
  },
  computed: {
    searchInput () {
      return this.$root.SEARCH_INPUT.value
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
      this.refreshAll()
    },
    searchInput () {
      if (!this.isMounted()) return
      this.scheduleFilter()
    },
    playlistStateChanged () {
      this.refreshAll()
    }
  },
  methods: {
    isMounted () {
      const path = this.$sbRouter.giveMeCurrent()
      return path.name === 'home' && path.params.which === 'tracks-list'
    },
    handleInputConfirm () {
      if (this.tracksFiltered && this.tracksFiltered.length === 1) {
        const track = this.$children.find(t => t.item.id === this.tracksFiltered[0].id)
        track && track.handleClick()
      }
    },
    async transitionTracks (what) {
      this.listAnimationClass = what
      await this.$sleep(this.listAnimationTime)
      return (!(this.transitioning = false))
    },
    async hideTracks () {
      await this.transitionTracks('hide')
    },
    async showTracks () {
      await this.transitionTracks('show')
    },
    refreshAll () {
      this.tracks = (this.$root.CONVERTED_TRACKS_FORMATTED || []).sort(this.$controllers.track.sort)
      this.scheduleFilter()
    },
    calcScrollOpacity () {
      let ratio = (this.getContainerElement().scrollTop / 100)
      if (ratio > 1) ratio = 1
      this.$setRootVar(this.scrollOpKeys, (this.filterBackgroundOpacity = ratio))
    },
    getContainerElement () {
      return (this.containerElement || (this.containerElement = this.$root.$refs['home-router']))
    },
    async scheduleFilter () {
      this.lastType = Date.now()
      await this.hideTracks()
      if (Date.now() - this.lastType < this.listAnimationTime) return
      this.filter()
      this.showTracks()
    },
    filter () {
      const txt = (this.searchInput && this.searchInput.toLowerCase()) || ''
      let noTracks = false
      if (!txt.length) {
        this.tracksFiltered = null
      } else {
        noTracks = (this.tracksFiltered = this.tracks.filter((track) => this.filterFn(track, txt))).length === 0
      }
      this.noTracks = noTracks
    },
    filterFn (track, txt) {
      const {name, artists} = track.data
      return [name, ...artists.map(({name}) => name)].some(token => token.toLowerCase().includes(txt))
    }
  },
  mounted () {
    this.refreshAll()
    this.$refs['actual-list'].style.setProperty('--list-transition-time', this.listAnimationTime + 'ms')
    // this.$root.plListEnv = this
    // this.$root.onComponentLoaderMount = function () {
    //   console.log('dousinho')
    //   const env = this.$root.plListEnv
    //   this.$(env.getContainerElement()).on('scroll', env.calcScrollOpacity)
    //   env.calcScrollOpacity()
    // }
  }
}
</script>

<style lang="scss" scoped>
$bezier: cubic-bezier(0, 1, 0, 1);
$bezier-chill: cubic-bezier(0, 1, .5, 1);

.tkl-container {
  --padding-x: var(--container-padding-x);
  --card-padding-x: .5em;
  /* margin-bottom: 2.4rem; */
  text-align: center;
  height: fit-content;
  width: 100%;
  box-sizing: border-box;
  padding: var(--container-padding-x) 0;
  padding-top: 0;
}
.actual-list {
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