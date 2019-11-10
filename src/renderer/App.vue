<template>
  <div  class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script>
import Modal from './components/Modal/Modal'
import electron from 'electron'
const ipc = electron.ipcRenderer

export default {
  name: 'SongBasket',
  components: {
    Modal
  },
  mounted () {
    window.sbDebug = this
    setInterval(() => {
      console.log(this.ffmpegBinsDownloaded)
    }, 500)
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
  @import url('./CSS/global.scss');
  @import url('./CSS/helpers.scss');

  .app-container {
    height: 100%;
    position: relative;
    z-index: 0;
  }
</style>
