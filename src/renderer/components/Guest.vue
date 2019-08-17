<template>
    <div
     :class="loadingState === 'Loading' ? 'loading' : 'doneloading'"
     class="display-whole-container alt">
            <!-- <router-link to="/" tag="button" class="button"  >Log in</router-link> -->
            <div class="top">
              <div class="radio-label">
                <span @click="changeMode(0)">Username</span>
              </div>
              <div 
              @click="changeMode()"
              class="radio-container">
                <div 
                :class="{'left': mode === 0, 'right': mode === 1}"
                class="radio-thumb"></div>
              </div>
              <div class="radio-label">
                <span @click="changeMode(1)">Playlist ID</span>
              </div>
            </div>

            <div class="mid">
              <input ref="guestSearchInput" autofocus class="guest-search-box" type="text" v-model.trim="userQuery" @keyup.enter.prevent="guestSearch" />
            </div>

            <div class="bot">
              <div v-if="loadingState !== null" class="loading-state-indicator">
                  {{loadingState}}
              </div>
              <button class="button button-wide" @click="guestSearch">Search</button>
            </div>
    </div>
</template>

<script>

export default {
  data () {
    return {
      userQuery: '',
      mode: 0
    }
  },
  computed: {
    loadingState () {
      let x = this.$store.state.SharedStates.loadingState
      switch (x) {
        case 'loading': return 'Loading'
        case 'not found': return this.mode ? 'User not Found' : 'Playlist not Found'
        case 'invalid id': return 'Invalid ID'
        case 'found': return null
        default: return null
      }
    }
  },
  methods: {
    guestSearch () {
      this.$emit('guestSearch', this.userQuery)
    },
    changeMode (mode) {
      if (!mode) this.mode = this.mode === 0 ? 1 : 0
      else this.mode = mode

      this.focusInput()
    },
    focusInput () {
      this.$refs.guestSearchInput.focus()
    }
  },
  mounted () {
    this.focusInput()
  }
}
</script>

<style lang="scss" scoped>
.alt {
  @keyframes shiftbackground {
    0% {background: var(--dark-body)}
    50% {background: rgb(139, 80, 52)}
    100% {background: var(--dark-body)}
  }
  // z-index: -1;
  flex-direction: column;
  justify-content: space-evenly;

  &.loading {
    animation: shiftbackground 3s ease-in-out infinite;
  }
}

.top {
  display: flex;
  justify-content: center;
  align-items: center;
}
.radio-label {
  font-family: 'Poppins Light';
  min-width: 7rem;
}



.radio-container {
  $time: 5s;
  $curve: cubic-bezier(.07,.98,.23,1);

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 2.7rem;
  min-height: 1.5rem;
  background: var(--white-text);
  border-radius: 500px;

  &:hover {
    .radio-thumb{
      
      transform: scale(1.1)
    }
  }
}
.radio-thumb {
  @keyframes goright {
    0% { left: 13%; }
    100% { left: 52%; }
  }
  @keyframes goleft {
    0% { left: 52%; }
    100% { left: 13%; }
  }
  $time: .15s;
  $curve: cubic-bezier(.79,.74,.26,.96);

  transition: transform $time $curve;

  position: absolute;
  width: 1rem;
  height: 1rem;
  background: var(--button-purple);
  border-radius: 500px;

  &.left {
    animation: goleft $time $curve;
    left: 13%;
    
  }
  &.right {
    animation: goright $time $curve;
    left: 52%;
    
  }
}
.guest-search-box{
  display: block;
  margin: 0;
  padding-bottom: 1rem;
  outline: none;
  width: 100%;
  font-size: 3rem;
  font-family: 'Poppins black';
  text-align: center;
  border: none;
  color: white;
  background: none;
  transition: transform .15s ease, background .2s ease;
}
.bot {
  position: relative;
}

.button-wide {
  min-width: 15rem;
  z-index: 0;
}

.loading-state-indicator{
  z-index: -1;
  color: var(--text-white);
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  font-size: 1.1rem;
}
</style>
