<template>
    <div  class="login-flex">
      <div v-if="$route.name !== 'set-home-folder'" class="login-header">{{header.text}}</div>
      <router-view
      path="/set-home-folder"
      @setHomeFolder="setHomeFolder" 
      @login="login"
      @guestSearch="guestSearch($event)" 
      @not-user="redirect('guest')"
      @confirm-user="confirmUser"
      > </router-view>
  </div>
</template>

<script>
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
    setHomeFolder () {
      window.ipc.send('setHomeFolder')
    },
    login () {
      window.ipc.send('login')
    },
    guestSearch (request) {
      if (this.loadingState !== 'Loading' && request.query !== '' && request.query !== undefined && request.query !== null) {
        this.$store.dispatch('SET_LOADING_STATE', 'loading')
        window.ipc.send('guestSignIn', request)
      }
    },
    redirect (path, payload) {
      switch (path) {
        case 'login': {
          this.header.text = 'Let\'s find your music'
          this.$router.push('/setup/login')
          break
        }
        case 'guest-verify': {
          this.$router.push({name: 'guest-verify', params: { user: payload }})
          this.header.text = 'Is this You?'
          break
        }
        case 'home': {
          this.$router.push({path: '/home'})
          break
        }
        case 'guest': {
          this.header.text = 'Let\'s find your music'
          this.$router.push('/setup/guest')
          break
        }
      }
    },
    confirmUser () {
      window.ipc.send('guestConfirm', this.userOnHold.id)
    }

  },
  mounted () {
    window.ipc.on('continueToLogin', () => {
      this.redirect('login')
    })

    window.ipc.on('not-found', () => {
      this.$store.dispatch('SET_LOADING_STATE', 'not found')
    })
    window.ipc.on('invalid', () => {
      this.$store.dispatch('SET_LOADING_STATE', 'invalid id')
    })

    window.ipc.on('user-found', (event, user) => {
      this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.userOnHold = user
      this.redirect('guest-verify', user)
    })

    window.ipc.on('playlists done', () => {
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
  justify-content: space-between;
  height: var(--max-container-height);
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