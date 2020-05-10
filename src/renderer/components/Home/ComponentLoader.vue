<template>
  <div :class="'router-view ' + routerAnimation"  ref="home-router">
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
      @openYtVideo="$emit('openYtVideo', $event)"
    ></playlist-view>
    <downloads-view
      v-show="componentBeingShown === 'downloads-view'"
    ></downloads-view>
  </div>
</template>

<script>
import PlaylistsList from './PlaylistsList'
import TracksList from './TracksList'
import PlaylistView from './PlaylistView/PlaylistView'
import DownloadsView from './DownloadsView/DownloadsView'
let sleep

export default {
  components: {
    PlaylistsList,
    TracksList,
    PlaylistView,
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
    async handleAnimation (to) {
      if (this.transitioning) return
      this.transitioning = this.$sbRouter.setTransitioningState(true)
      let anim1
      let anim2 = 'fast '
      let pull = 'pull'
      let push = 'push'

      if (to.name === 'home') {
        anim1 = pull
        anim2 += push
      } else {
        anim1 = push
        anim2 += pull
      }
      this.routerAnimation = anim1

      await sleep(300)
      this.makeTransition(to)
      this.routerAnimation = anim2

      await sleep(100)
      this.routerAnimation = 'release'

      await sleep(100)
      this.transitioning = this.$sbRouter.setTransitioningState()
    },
    makeTransition (to) {
      this.currentPath = to
      this.componentBeingShown = to.name
    },
    async handleRouteChange (to, from) {
      await this.handleAnimation(to)
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