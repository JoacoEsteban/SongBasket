<template>
  <div class="container">
    <router-link to="/home" tag="span">
      <settings-icon />
    </router-link>
    
    <h1>{{playlist.name}}</h1>
      <div v-for="(song, index) in playlist.tracks.items" :key="index"> {{song.track.name}} </div>
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;
import "vuex";
import settingsIcon from '../../assets/icons/settings-icon.vue'


export default {
  data() {
    return {
      //TODO make it work
    };
  },
  components:{
    settingsIcon
  },
  computed: {
    playlist(){
      return this.$store.getters.CurrentPlaylist
    }
  },
  mounted(){
    console.log('PLAYLISTTTTT:::::', this.playlist)
  }
};
</script>

<style>
</style>
