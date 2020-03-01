<template>
  <div  class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script>
import Modal from './components/Modal/Modal'
import StylesLoader from './CSS/styles-loader'
import $ from 'jquery'

function isAscii (code) {
  return code >= 48 && code <= 90
}

export default {
  name: 'SongBasket',
  components: {
    Modal,
    StylesLoader
  },
  methods: {
    redirect (path, payload) {
      path = (path[0] === '/' ? '' : '/') + path
      if (path === this.$route.fullPath) return console.error('ERROR Trying to navigate to same path')
      this.$router.push(path)
    },
    handleWindowKey ({keyCode}) {
      if (!isAscii(keyCode)) return
      this.$root.searchInputElement && this.$root.searchInputElement.focus()
    },
    invalidatePlTransformCache () {
      this.$root.plTransformInvalidation = Date.now()
    }
  },
  created () {
    window.ipc.on('initializeSetup', () => {
      // this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('setup')
    })
    window.ipc.on('dataStored', async () => {
      this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('home')
    })
    $(window).on('keydown', this.handleWindowKey)
  },
  beforeCreate () {
    window.VUE_ROOT = this.$root
    window.sbDebug = this
  },
  mounted () {
    this.$root.plTransformInvalidation = 0
    window.addEventListener('mousewheel', this.invalidatePlTransformCache)
    window.addEventListener('resize', this.invalidatePlTransformCache)
    $(document).ready(function () {
      setTimeout(() => {
        window.ipc.send('DOCUMENT_READY_CALLBACK')
      }, 1000)
    })
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
