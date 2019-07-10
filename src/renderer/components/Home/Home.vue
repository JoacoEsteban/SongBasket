<template>
    <div>
        <router-link to="/" tag="button" class="button">Logout</router-link>
        <div v-if="user !== undefined" >

            <user-data :user="user" ></user-data>
            <playlist v-for="playlist in playlists.items" :playlist="playlist" :key="playlist.id" />
        </div>
    </div>
</template>

<script>
import Playlist from './Playlist.vue';
import UserData from './UserData.vue';

export default {
    components:{
        Playlist,
        UserData,
    },
    data(){
        return{
            user: this.$route.params.user.user,
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
