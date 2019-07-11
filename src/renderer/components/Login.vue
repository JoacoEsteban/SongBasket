<template>
    <div>
            <h1>SongBasket</h1>
            <button class="button" @click="login">Login to Spotify</button>
            <div>or</div>
            <router-link to="/home" tag="button" class="button"  >Continue without Logging in</router-link>
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer;

export default {
  methods:{
    login(){
        ipc.send('login')
    }
    },
    //Auto login For dev speed purposes
    // mounted(){
    //     this.login();
    // }
}
</script>

<style>
    @import url('../CSS/global.css');
</style>
