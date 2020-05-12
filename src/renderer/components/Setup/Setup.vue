<template>
    <div class="login-container window-drag-recursive" :style="'--offset: ' + offsetPtg + '%'">
      <set-home-folder @handleClick="setHomeFolder" />
      <div class="user-login-container">
        <div class="login-header">{{header.text}}</div>
        <div class="components-wrapper">
          <Login />
          <Guest />
          <guest-verify />
        </div>
      </div>
  </div>
</template>

<script>
import SetHomeFolder from './SetHomeFolder'
import Login from '../Login'
import Guest from './Guest'
import GuestVerify from './GuestVerify'
export default {
  components: {
    SetHomeFolder,
    Login,
    Guest,
    GuestVerify
  },
  data () {
    return {
      header: {
        show: true,
        text: "Let's find your music",
        userOnHold: null,
        showHeader: false
      },
      currentSlide: 0
    }
  },
  computed: {
    action () {
      return this.$route.params.action
    },
    loadingState () {
      return this.$store.state.loadingState
    },
    offsetPtg () {
      return (this.currentSlide || 0) * 100
    }
  },
  methods: {
    setHomeFolder () {
      try {
        // await this.$IPC.send('setHomeFolder')
        this.next()
      } catch (error) {
      }
    },
    next () {
      console.log('next', this.currentSlide)
      this.currentSlide++
      console.log('next', this.currentSlide)
    },
    login () {
      this.$IPC.send('LOGIN')
    },
    guestSearch (request) {
      if (this.loadingState !== 'Loading' && request.query !== '' && request.query !== undefined && request.query !== null) {
        this.$store.dispatch('SETUP_LOADING_STATE', 'loading')
        this.$IPC.send('guestSignIn', request)
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
      this.$IPC.send('guestConfirm', this.userOnHold.id)
    }

  },
  mounted () {
    this.$IPC.on('continueToLogin', () => {
      this.redirect('login')
    })

    this.$IPC.on('not-found', () => {
      this.$store.dispatch('SETUP_LOADING_STATE', 'not found')
    })
    this.$IPC.on('invalid', () => {
      this.$store.dispatch('SETUP_LOADING_STATE', 'invalid id')
    })

    this.$IPC.on('user-found', (event, user) => {
      this.$store.dispatch('SETUP_LOADING_STATE', 'found')
      this.userOnHold = user
      this.redirect('guest-verify', user)
    })

    this.$IPC.on('playlists done', () => {
      this.$store.dispatch('SETUP_LOADING_STATE', 'found')
      this.redirect('home')
    })
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  height: var(--max-container-height);
  position: relative;
  --offset: 0px;
  transition: bottom var(--ts-g);
  bottom: calc(var(--offset) * -1);
  > div {
    min-height: 100%;
  }
}
.login-header {
  $h: 20vmax;
  min-height: $h;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 7vw;
  font-family: 'Poppins Bold';
  background: var(--global-grey)
}

.user-login-container {
  display: flex;
  flex-direction: column;
  .components-wrapper {
    display: flex;
    height: 100%;
    > div {
      min-width: 100%;
    }
  }
}
</style>