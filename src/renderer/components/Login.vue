<template>
    <div>
            <h1>SongBasket</h1>
            <p>Using Vue.JS </p>
            <button class="login-button" @click="login">Login to Spotify</button>

            <div v-for="playlist in playlists" :key="playlist.id">
                {{ playlist.name }}
            </div>
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer;

export default {
    data(){
        return{
            playlists: undefined,

        }
    },
  methods:{
    login(){
        ipc.send('login')
    }
    },
    //Auto login For dev speed purposes
    mounted(){
        this.login();
    }
}
</script>

<style>
    @import url('../CSS/global.css');
</style>
