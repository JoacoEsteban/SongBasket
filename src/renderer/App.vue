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
  },
  mounted () {
    window.sbDebug = this
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
