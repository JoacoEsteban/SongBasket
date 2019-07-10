<template>
    <div>
        <div v-if="user !== undefined" >
            <status-bar :user="user" ></status-bar>

            <playlist v-for="playlist in playlists.items" :playlist="playlist" :key="playlist.id" />
            
            <user-data :user="user" :playlistCount="playlists.total.toString()" ></user-data>
        </div>
        <router-link to="/" tag="button" class="button">Logout</router-link>
    </div>
</template>

<script>
import StatusBar from './StatusBar.vue';
import Playlist from './Playlist.vue';
import UserData from './UserData.vue';

export default {
    components:{
        StatusBar,
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

</style>
