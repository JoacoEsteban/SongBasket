<template>
  <div class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script>
import Modal from './components/Modal/Modal'
import StylesLoader from './CSS/styles-loader'
export default {
  name: 'SongBasket',
  components: {
    Modal,
    StylesLoader
  },
  watch: {
    isConnected (val) {
      this.$('html')[val ? 'removeClass' : 'addClass']('disconnected')
    }
  },
  computed: {
    isConnected () {
      return this.$store.state.SharedStates.CONNECTED_TO_INTERNET
    },
    isConnectedToApi () {
      return this.$store.state.SharedStates.CONNECTED_TO_API
    }
  },
  beforeCreate () {
    this.$root.DOWNLOADED_TRACKS = {}
    window.ROOT = this.$root
    window.VUEX = this.$store
    window.VUEX_CURRENT_USER = this.$store.state.CurrentUser
    window.sbDebug = this
  },
  created () {
    this.$sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
  },
  async mounted () {
    this.$root.cardTransformInvalidation = 0
    this.$root.OPEN_MODAL = this.$store._actions.openModal[0]
    // TODO fix router push without timeout
    await this.$sleep(1000)
    window.VUE_HAS_MOUNTED = true
  }
}
</script>

<style lang="scss">
  .app-container {
    height: 100%;
    position: relative;
    z-index: 0;
  }
</style>
