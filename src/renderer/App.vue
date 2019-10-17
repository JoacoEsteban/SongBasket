<template>
    <router-view id="app"></router-view>
</template>

<script>
  
export default {
    name: 'SongBasket',
    mounted () {
      window.sbDebug = this
    }
  }
</script>

<style lang="scss">
  @import url('./CSS/global.scss');
  @import url('./CSS/helpers.scss');
</style>
