<template>
    <div>
        <h1>{{user.display_name}} Playlists</h1>
        <Playlist :playlists="playlists.items" ></Playlist>
    </div>
</template>

<script>
import Playlist from './Playlist.vue';

export default {
    components:{
        Playlist
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
