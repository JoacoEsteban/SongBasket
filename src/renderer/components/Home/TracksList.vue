<template>
  <div ref="tracks-list" class="tkl-container">
    <div class="filters-container">
      <div class="filters-content">
        <div class="search-bar global-scroll-shadow">
          <div class="filters-background show-on-scroll">
          </div>
          <input placeholder="Start Typing" autofocus @focus="searchInputOnFocus" @blur="searchInputOnBlur" v-model.trim="searchInput" ref="tracks-search-input" class="input-light semibold" type="text" @keydown.enter="handleInputConfirm">
        </div>
        <div class="filter-buttons">

        </div>
      </div>
    </div>
    <div ref="actual-list" class="actual-list row" :class="listAnimationClass" v-if="showList">
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
    <!-- <div class="background-container">
      dalebro
    </div> -->
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
      searchInput: '',
      tracks: [],
      tracksFiltered: null,
      filterMap: {},
      showList: true,
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
    searchInput (val) {
      this.filterTracks()
    },
    playlistStateChanged () {
      this.refreshAll()
    }
  },
  methods: {
    searchInputOnFocus () {
      this.$root.searchInputElement = null
    },
    searchInputOnBlur () {
      this.$root.searchInputElement = this.$refs['tracks-search-input']
    },
    handleInputConfirm () {
      if (this.tracksFiltered && this.tracksFiltered.length === 1) {
        const track = this.$children.find(t => t.item.id === this.tracksFiltered[0].id)
        track && track.handleClick()
      }
    },
    transitionTracks (what) {
      return new Promise((resolve, reject) => {
        // if (this.transitioning) resolve(false)
        this.transitioning = true
        this.listAnimationClass = what
        setTimeout(() => {
          resolve(!(this.transitioning = false))
        }, this.listAnimationTime)
      })
    },
    hideTracks () {
      return new Promise((resolve, reject) => {
        this.transitionTracks('hide')
          .then(res => resolve(res))
          .catch(err => reject(err))
      })
    },
    showTracks () {
      return new Promise((resolve, reject) => {
        this.transitionTracks('show')
          .then(res => resolve(res))
          .catch(err => reject(err))
      })
    },
    refreshAll () {
      this.tracks = this.$root.CONVERTED_TRACKS_FORMATTED
      console.log('aber', this.tracks)
      this.filterTracks()
    },
    calcScrollOpacity () {
      let ratio = (this.getContainerElement().scrollTop / 100)
      if (ratio > 1) ratio = 1
      this.$setRootVar(this.scrollOpKeys, (this.filterBackgroundOpacity = ratio))
    },
    getContainerElement () {
      return (this.containerElement || (this.containerElement = this.$root.$refs['home-router']))
    },
    filterTracks () {
      if (this.lastType) clearTimeout(this.lastType)
      this.hideTracks()
        .then(() => {
          let txt = this.searchInput.toLowerCase()
          let noTracks = false
          if (!txt.length) {
            this.tracksFiltered = null
          } else {
            console.log('gettin in')
            // noTracks = (this.tracksFiltered = this.filterMap[txt] || (this.filterMap[txt] = this.tracks.filter((track) => this.filterFn(track, txt)))).length === 0
            noTracks = (this.tracksFiltered = this.tracks.filter((track) => this.filterFn(track, txt))).length === 0
          }
          this.noTracks = noTracks
        })
      this.lastType = setTimeout(this.showTracks, this.listAnimationTime + 10)
    },
    filterFn (track, txt) {
      const {name, artists} = track.data
      return [name, ...artists.map(({name}) => name)].some(token => token.toLowerCase().includes(txt))
    }
  },
  beforeDestroy () {
    this.searchInputOnFocus()
  },
  mounted () {
    this.searchInputOnBlur()
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