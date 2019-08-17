<template>
    <div  class="login-flex">
      <div v-if="$route.name !== 'set-home-folder'" class="login-header">{{header.text}}</div>
      <router-view
      path="/set-home-folder"
      @init="setHomeFolder" 
      @guestSearch="guestSearch($event)" 
      > </router-view>
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
        text: null,
        state: null
      }
    }
  },
  computed: {
    action () {
      return this.$route.params.action
    },
    loadingState () {
      return this.$store.state.loadingState
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
    },
    guestSearch (userQuery) {
      if (this.loadingState !== 'Loading' && userQuery !== '' && userQuery !== undefined && userQuery !== null) {
        this.$store.dispatch('SET_LOADING_STATE', 'loading')
        ipc.send('guestSignIn', { userQuery: userQuery })
      }
    }
  },
  mounted () {
    ipc.on('continueToLogin', () => this.$router.push('login'))

    ipc.on('not-found', () => {
      this.$store.dispatch('SET_LOADING_STATE', 'not found')
    })
    ipc.on('invalid', () => {
      this.$store.dispatch('SET_LOADING_STATE', 'invalid id')
    })

    ipc.on('playlists done', (e) => {
      this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.$router.push({path: '/home'})
    })

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