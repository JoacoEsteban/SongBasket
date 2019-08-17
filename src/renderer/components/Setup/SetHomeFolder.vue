<template>
    <div class="login-flex">
    <div class="login-container">
      <div class="login-sb-welcome">welcome to</div>
      <div class="login-sb-title">SongBasket</div>
      <button class="button" @click="init">Set a Home Folder</button>
    </div>
  </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  methods: {
    init () {
      ipc.send('setHomeFolder')
    }
  },
  mounted () {
    ipc.on('continueToLogin', () => this.$router.push('login'))
  }

}
</script>

<style scoped lang="scss">
    
</style>