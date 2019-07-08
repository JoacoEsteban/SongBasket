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
export default {
    data(){
        return{
            playlists: undefined,

        }
    },
  methods:{
    login(){
        const localBackend = 'http://localhost:5000';
        const herokuBackend = 'https://songbasket-backend.herokuapp.com';
        const Backend = localBackend;
        
        // window.open('https://accounts.spotify.com/authorize?client_id=30e3ebd25fd04ac5b1e2dfe889fdc90c&redirect_uri=https://spotify-api-wrapper-joaco.herokuapp.com/&scope=user-read-private%20user-read-email%20playlist-read-private&response_type=token&show_dialog=true')
        window.open(`${Backend}/init`)
         
         // fetchPlaylists();
    }
    },
}
</script>
