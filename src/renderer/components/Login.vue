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
      let loginSuccess = true
        // window.open('https://accounts.spotify.com/authorize?client_id=30e3ebd25fd04ac5b1e2dfe889fdc90c&redirect_uri=https://spotify-api-wrapper-joaco.herokuapp.com/&scope=user-read-private%20user-read-email%20playlist-read-private&response_type=token&show_dialog=true')
        if (loginSuccess)
        {
            // fetchPlaylists();
            fetch('http://localhost:5000/temp-playlists')
            .then(response => response.json())
            .then(json => {console.log(json.items); this.playlists = json.items});
        }
    }
    },
}
</script>
