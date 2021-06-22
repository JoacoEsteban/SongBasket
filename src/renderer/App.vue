<template>
  <div class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script lang="ts">

import Modal from './components/Modal/Modal.vue'
import StylesLoader from './CSS/styles-loader.vue'

export default {
  name: 'SongBasket',
  components: {
    Modal,
    StylesLoader
  },
  watch: {
    isConnected (val) {
      this.$root.$('html')[val ? 'removeClass' : 'addClass']('disconnected')
    }
  },
  computed: {
    isConnectedToApi (): boolean {
      return this.$store.state.SharedStates.CONNECTED_TO_API
    },
    isConnected (): boolean {
      return this.$store.state.SharedStates.CONNECTED_TO_INTERNET && this.isConnectedToApi
    }
  },
  beforeCreate () {
    this.$root.DOWNLOADED_TRACKS = {}
    this.$root.SEARCH_INPUT = {
      writeEvent: false,
      value: ''
    }
    window.ROOT = this.$root
    // window.VUEX = this.$store
    // window.VUEX_CURRENT_USER = this.$store.state.CurrentUser
    window.sbDebug = this
  },
  created () {
    this.$root.$sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
  },
  async mounted () {
    this.$root.cardTransformInvalidation = 0
    this.$root.OPEN_MODAL = this.$store._actions.openModal[0]
    // TODO fix router push without timeout
    console.log(this)
    await this.$root.$sleep(1000)
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
