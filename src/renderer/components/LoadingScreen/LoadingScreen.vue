<template>
    <div  class="login-flex">
      Loading
  </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      header: {
        show: true,
        text: "Let's find your music",
        userOnHold: null
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
  methods: {
    redirect (path, payload) {
      switch (path) {
        case 'setup': {
          // this.header.text = 'Let\'s find your music'
          this.$router.push('/setup')
          break
        }
        case 'home': {
          // this.header.text = 'Let\'s find your music'
          this.$router.push('/home')
          break
        }
      }
    }
  },
  created () {
    // ipc.on('continueToLogin', () => {
    //   this.redirect('login')
    // })

    // ipc.on('not-found', () => {
    //   this.$store.dispatch('SET_LOADING_STATE', 'not found')
    // })
    // ipc.on('invalid', () => {
    //   this.$store.dispatch('SET_LOADING_STATE', 'invalid id')
    // })

    // ipc.on('user-found', (event, user) => {
    //   this.$store.dispatch('SET_LOADING_STATE', 'found')
    //   this.userOnHold = user
    //   this.redirect('guest-verify', user)
    // })

    // ipc.on('playlists done', () => {
    //   this.$store.dispatch('SET_LOADING_STATE', 'found')
    //   this.redirect('home')
    // })

    ipc.on('initializeSetup', () => {
      console.log('a vere man')
      // this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('setup')
    })
    ipc.on('dataStored', () => {
      console.log('tamos listo')
      this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('home')
    })
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
  justify-content: center;
  text-align: center;
  align-self: center;
  height: 100vh;
}
.login-header {
  min-height: 20vmax;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 7vw;
  font-family: 'Poppins Bold';
  background: var(--global-grey)
}
</style>