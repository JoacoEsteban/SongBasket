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
import electron from 'electron'
const ipc = electron.ipcRenderer

export default {
  name: 'SongBasket',
  components: {
    Modal,
    StylesLoader
  },
  mounted () {
    window.sbDebug = this
  },
  computed: {
    ffmpegBinsDownloaded () {
      return this.$store.state.Events.FFMPEG_BINS_DOWNLOADED
    }
  },
  watch: {
    ffmpegBinsDownloaded () {
      ipc.send('ffmpegBinsDownloaded')
    }
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
