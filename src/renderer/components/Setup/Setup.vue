<template>
    <div  class="login-flex">
      <div v-if="$route.name !== 'set-home-folder'" class="login-header">{{header.text}}</div>
      <router-view path="/set-home-folder" @init="setHomeFolder" > </router-view>
  </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      header: {
        show: false,
        text: null
      }
    }
  },
  computed: {
    action () {
      return this.$route.params.action
    }
  },
  watch: {
    action (val) {
      console.log('afasdf', val)
    }
  },
  methods: {
    setHomeFolder () {
      ipc.send('setHomeFolder')
    }
  },
  mounted () {
    ipc.on('continueToLogin', () => this.$router.push('login'))
    this.header = {show: true, text: "Let's find your music"}
  }
}
</script>

<style scoped lang="scss">
.display-whole-container {
  text-align: center;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-flex {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
}
.login-header {
  min-height: 8.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-family: 'Poppins Bold';
  background: var(--global-grey)
}
</style>