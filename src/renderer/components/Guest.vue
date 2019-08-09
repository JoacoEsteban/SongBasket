<template>
    <div class="login-container">
            <!-- <router-link to="/" tag="button" class="button"  >Log in</router-link> -->
            <h1 class="login-sb-title">Guest</h1>
                <input id="guestSearchInput" autofocus class="guest-search-box" type="text" v-model.trim="userQuery" @keyup.enter.prevent="guestSearch" />
            <button class="button" @click="guestSearch">Search User</button>
            <div v-if="found !== undefined" class="guest-not-found">
                {{found}}
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
      found: undefined
    }
  },
  methods: {
    guestSearch () {
      if (this.found !== 'Loading') {
        if (this.userQuery !== '') {
          this.found = 'Loading'
          ipc.send('guestSearch', { userQuery: this.userQuery })
        }
      }
    }
  },
  mounted () {
    document.getElementById('guestSearchInput').focus()
    ipc.on('not-found', () => {
      this.found = 'User not found'
    })
  }
}
</script>

<style>
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
