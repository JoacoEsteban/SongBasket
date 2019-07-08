<template>
    <div>
            <h1>SongBasket</h1>
            <p>Using Vue.JS </p>
            <button @click="login">Login to Spotify</button>

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
        
        
        // const localBackend = 'http://localhost:5000';
        // const herokuBackend = 'https://songbasket-backend.herokuapp.com';
        // const Backend = localBackend;
        
        // window.open(`${Backend}/init`)
         
         // fetchPlaylists();
    }
    },
}
</script>
