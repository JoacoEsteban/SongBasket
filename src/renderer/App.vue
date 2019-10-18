<template>
  <div  class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script>
import Modal from './components/Modal/Modal'

export default {
  name: 'SongBasket',
  components: {
    Modal
  },
  mounted () {
    window.sbDebug = this
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
