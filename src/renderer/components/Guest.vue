<template>
    <div class="display-whole-container alt">
            <!-- <router-link to="/" tag="button" class="button"  >Log in</router-link> -->
            <div class="top">
              <div class="radio-label">
                Username
              </div>
              <div 
              @click="changeMode"
              class="radio-container">
                <div 
                :class="{'left': mode === 0, 'right': mode === 1}"
                class="radio-thumb"></div>
              </div>
              <div class="radio-label">
                Playlist ID
              </div>
            </div>

            <div class="mid">
              <input id="guestSearchInput" autofocus class="guest-search-box" type="text" v-model.trim="userQuery" @keyup.enter.prevent="guestSearch" />
            </div>

            <div class="bot">
              <button class="button" @click="guestSearch">Search</button>
              <div v-if="found !== undefined" class="guest-not-found">
                  {{found}}
              </div>
            </div>
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      userQuery: '',
      mode: 0,
      found: undefined
    }
  },
  methods: {
    guestSearch () {
      if (this.found !== 'Loading') {
        if (this.userQuery !== '') {
          this.found = 'Loading'
          ipc.send('guestSignIn', { userQuery: this.userQuery })
        }
      }
    },
    changeMode () {
      if (this.mode === 0) this.mode = 1
      else this.mode = 0
    }
  },
  mounted () {
    document.getElementById('guestSearchInput').focus()
    ipc.on('not-found', () => {
      this.found = 'User not found'
    })
    ipc.on('invalid', () => {
      this.found = 'Invalid User ID'
    })
  }
}
</script>

<style lang="scss" scoped>
.alt {
  flex-direction: column;
  justify-content: space-evenly;
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
.guest-not-found{
    margin-top: 1rem;
    font-size: 1.5rem;
}
</style>
