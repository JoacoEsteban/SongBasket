<template>
    <div>
        <div class="home-container" v-if="user !== undefined" >
            <top-bar :user="user" ></top-bar>

            <div class="home-playlists-container">
                <playlist v-for="playlist in playlists.items" :playlist="playlist" :key="playlist.id" />
            </div>
            <button class="button">Load More</button>
            <user-data :user="user" :playlistCount="playlists.total.toString()" ></user-data>
        </div>
        <router-link to="/" tag="button" class="button">Logout</router-link>
    </div>
</template>

<script>
import TopBar from './TopBar.vue';
import Playlist from './Playlist.vue';
import UserData from './UserData.vue';

export default {
    components:{
        TopBar,
        Playlist,
        UserData,
    },
    data(){
        return{
            user: this.$route.params.user.user,
            // user: {display_name: 'Joaco Esteban'},
            playlists: this.$route.params.user.playlists,
        }
    },
    mounted(){
        console.log(this.playlists)
    }


}
</script>

<style>
.home-container{
    text-align: center;
}
    .home-playlists-container{
        text-align: center;
    }
</style>
