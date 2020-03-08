<template>
  <div :class="'router-view ' + routerAnimation">
    <playlists-list
      v-show="showPlList"
      @openPlaylist="$emit('openPlaylist', $event)"
      @addPlaylistToSyncQueue="$emit('addPlaylistToSyncQueue', $event)"
    ></playlists-list>
    <playlists-view
      v-show="componentBeingShown === 'playlist-view'"
      :currentPlaylist="currentPath.params && currentPath.params.id"
      @openYtVideo="$emit('openYtVideo', $event)"
    ></playlists-view>
  </div>
</template>

<script>
import PlaylistsList from './PlaylistsList'
import PlaylistsView from './PlaylistView/PlaylistView'
let sleep

export default {
  components: {
    PlaylistsList,
    PlaylistsView
  },
  data () {
    return {
      currentPath: this.$sbRouter.path.name,
      componentBeingShown: this.$sbRouter.path.name,
      transitioning: false,
      routerAnimation: ''
    }
  },
  computed: {
    showPlList () {
      return this.currentPath.name === 'home' && this.currentPath.params.which === 'playlists-list'
    }
  },
  created () {
    sleep = this.$sleep
    this.$sbRouter.beforeTransition(this.handleRouteChange)
    this.$sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
  },
  methods: {
    async handleAnimation (to) {
      if (this.transitioning) return
      this.transitioning = true
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
      this.transitioning = false
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