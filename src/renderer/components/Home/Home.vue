<template>
    <div>
        <div class="home-container" v-if="user !== undefined" >
            <top-bar ></top-bar>

            <div class="home-playlists-container">
                <playlist v-for="playlist in playlists.items" :playlist="playlist" :key="playlist.id" />
                <div><button class="button">Load More</button></div>
            </div>
            <user-data ></user-data>
        </div>
        <!-- <router-link to="/" tag="button" class="button">Logout</router-link> -->
    </div>
</template>

<script>
import 'vuex'

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
            user: this.$store.state.CurrentUser.user,
            playlists: this.$store.state.CurrentUser.playlists,
        }
    },
    mounted(){
        console.log(this.$store.state)
    }


}
</script>

<style>
.home-container{
    text-align: center;
}
.home-playlists-container{
    margin-bottom: 2.4rem;
    text-align: center;
}
</style>
