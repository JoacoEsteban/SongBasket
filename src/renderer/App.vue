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
      switch (path) {
        case 'setup': {
          // this.header.text = 'Let\'s find your music'
          this.$router.push('/setup')
            .catch(err => console.error('daddddaa', err))
          break
        }
        case 'home': {
          return this.$router.push('/home')
        }
      }
    },
    handleWindowKey ({keyCode}) {
      if (!isAscii(keyCode)) return
      this.$root.searchInputElement && this.$root.searchInputElement.focus()
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
