<template>
    <div class="login-container window-drag-recursive" :style="'--offset: ' + offsetPtg + '%'">
      <set-home-folder @handleClick="setHomeFolder" />
      <div class="user-login-container">
        <div class="login-header">{{header.text}}</div>
        <div class="slider-container">
          <div class="slider" :style="{'--offset-x': offsetXPtg}">
            <Login v-if="showLogin" @login="login" @guestLogin="nextSub" />
            <Guest @backLogin="backLogin" v-if="showLogin" />
            <guest-verify v-if="showLogin" />
          </div>
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
      controller: this.$root.$controllers.setup,
      currentSlide: 0,
      currentSubSlide: 0
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
    },
    offsetXPtg () {
      return -((this.currentSubSlide || 0) * 100) + '%'
    },
    showLogin () {
      return this.currentSlide === 1
    }
    // showLogin () {
    //   return this.currentSlide === 1 && this.currentSubSlide === 0
    // },
    // showGuest () {
    //   return this.currentSlide === 1 && this.currentSubSlide === 1
    // },
    // showGuestVerify () {
    //   return this.currentSlide === 1 && this.currentSubSlide === 2
    // }
  },
  methods: {
    setHomeFolder () {
      try {
        // await this.$IPC.send('setHomeFolder')
        this.next()
      } catch (error) {
      }
    },
    async transition () {
      await this.$sleep(300)
    },
    async next () {
      // if ()
      this.currentSlide++
      await this.transition()
    },
    async prev () {
      if (this.currentSlide === 0) return
      this.currentSlide++
      await this.transition()
    },
    async nextSub () {
      this.currentSubSlide++
      await this.transition()
    },
    async prevSub () {
      if (this.currentSubSlide === 0) return
      this.currentSubSlide--
      await this.transition()
    },
    async backLogin () {
      this.prevSub()
      await this.transition()
      this.login()
    },
    login () {
      this.controller.login()
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
    min-width: 100vw;
  }
}
.login-header {
  $h: 20vmax;
  min-height: $h;
  width: 100%;
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

  .slider-container {
    height: 100%;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }
  .slider {
    position: relative;
    left: var(--offset-x);
    transition: left var(--ts-g);
    display: flex;
    width: auto;
    height: 100%;
    > div {
      min-width: 100%;
      height: 100%;
    }

  }
}
</style>