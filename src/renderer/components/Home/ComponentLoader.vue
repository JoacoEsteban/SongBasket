<template>
  <div :class="'router-view ' + routerAnimation" ref="home-router">
    <playlists-list
      v-show="showPlList"
      @openPlaylist="$emit('openPlaylist', $event)"
    ></playlists-list>
    <tracks-list
      v-show="showTracksList"
      @openPlaylist="$emit('openPlaylist', $event)"
    ></tracks-list>
    <playlist-view
      v-show="componentBeingShown === 'playlist-view'"
      :currentPlaylist="currentPath.params && currentPath.params.id"
    ></playlist-view>
    <track-review
      :refresh="componentBeingShown === 'track-review'"
      v-show="componentBeingShown === 'track-review'"
    ></track-review>
    <downloads-view
      v-show="componentBeingShown === 'downloads-view'"
    ></downloads-view>
  </div>
</template>

<script>
import PlaylistsList from './PlaylistsList'
import TracksList from './TracksList'
import PlaylistView from './PlaylistView/PlaylistView'
import TrackReview from './TrackReview/TrackReview'
import DownloadsView from './DownloadsView/DownloadsView'
let sleep

export default {
  components: {
    PlaylistsList,
    TracksList,
    PlaylistView,
    TrackReview,
    DownloadsView
  },
  data () {
    return {
      currentPath: this.$sbRouter.path,
      componentBeingShown: this.$sbRouter.path.name,
      transitioning: false,
      routerAnimation: ''
    }
  },
  computed: {
    showPlList () {
      return this.currentPath.name === 'home' && this.currentPath.params.which === 'playlists-list'
    },
    showTracksList () {
      return this.currentPath.name === 'home' && this.currentPath.params.which === 'tracks-list'
    }
  },
  created () {
    sleep = this.$sleep
    this.$sbRouter.beforeTransition(this.handleRouteChange)
  },
  mounted () {
    this.$root.$refs['home-router'] = this.$refs['home-router']
    this.$root.onComponentLoaderMount && this.$root.onComponentLoaderMount()
  },
  methods: {
    async handleAnimation (to, from) {
      if (this.transitioning) return
      this.$refs['home-router'] && (this.$refs['home-router'].scrollTop = 0)
      this.transitioning = this.$sbRouter.setTransitioningState(true)
      let anim1
      let anim2 = 'fast '
      const pull = 'pull'
      const push = 'push'
      const left = 'left'
      const right = 'right'

      if (to.name === 'home') {
        if (from.name === 'home') {
          anim1 = to.params.which === 'tracks-list' ? left : right
          anim2 += (anim1 === right ? left : right)
        } else {
          anim1 = pull
          anim2 += push
        }
      } else {
        if (to.name === 'track-review') {
          anim1 = left
          anim2 += right
        } else if (from.name === 'track-review') {
          anim1 = right
          anim2 += left
        } else {
          anim1 = push
          anim2 += pull
        }
      }
      this.routerAnimation = anim1

      await sleep(300)
      this.makeTransition(to)
      this.routerAnimation = anim2

      await sleep(100)
      this.routerAnimation = 'release'

      await sleep(100)
      this.transitioning = this.$sbRouter.setTransitioningState(3)
    },
    makeTransition (to) {
      this.currentPath = to
      this.componentBeingShown = to.name
    },
    async handleRouteChange (to, from) {
      await this.handleAnimation(to, from)
    }
  }
}
</script>

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

  &.push,
  &.pull,
  &.left,
  &.right {
    opacity: 0;
  }
  &.push {
    transform: scale(.75);
    opacity: 0;
  }
  &.pull {
    transform: scale(1.5);
    opacity: 0;
  }
  $x-offset: 3em;
  &.left {
    transform: translateX(-$x-offset);
  }
  &.right {
    transform: translateX($x-offset);
  }
  &.release {
    opacity: 1;
    transform: scale(1) translateX(0)
  }
}

</style>