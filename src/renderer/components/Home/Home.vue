<template>
    <div>
        <div v-if="playlists.length" class="home-container" >
        
            <top-bar ></top-bar>

            <div class="home-playlists-container">
                <playlist v-for="playlist in playlists" :playlist="playlist" :key="playlist.id" />
                <div v-if="!allLoaded"><button class="button" @click="loadMore" >{{ loading ? 'Loading' : 'Load More'}}</button></div>
            </div>
        
            <user-data ></user-data>
        
        </div>
        <empty v-if="!playlists.length" />
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer;

import 'vuex'

import TopBar from './TopBar.vue';
import Playlist from './Playlist.vue';
import UserData from './UserData.vue';
import Empty from './Empty.vue';

export default {
    components:{
        TopBar,
        Playlist,
        UserData,
        Empty,
    },
    data(){
        return{
            user: this.$store.state.CurrentUser.user,
            control: this.$store.state.CurrentUser.control,
            playlists: this.$store.state.CurrentUser.playlists,
            loading: false,
        }
    },
    computed:{
        allLoaded: function() {return this.control.total - this.control.offset <= 0},
    },


    methods:{
        loadMore(){
            if(!this.loading)
            {
                this.loading = true;
                ipc.send('loadMore');
            }
        }
    },


    mounted(){
        ipc.on('done loading', () => {
            this.loading = false
            console.log('jejexd')
        });
    },
    destroyed(){
        console.log("DESTROYING:::::")
        this.$store.dispatch('CLEAR_USER_N_PLAYLISTS')
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
