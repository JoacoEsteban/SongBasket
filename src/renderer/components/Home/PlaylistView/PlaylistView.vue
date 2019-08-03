<template>
  <div class="home-router plv-container">    

    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlist.images[0].url+')'"></div>
    </div>
    <div class="plv-rightpanel">
      <div class="plv-rp-data">
        <div class="plv-rp-data-plname">{{playlist.name}}</div>
      </div>
      <div class="plv-rp-tracklist">
      </div>

    </div>



      <!-- <div v-for="(song, index) in playlist.tracks.items" :key="index"> {{song.track.name}} </div> -->
  
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;
import "vuex";
import settingsIcon from '../../../assets/icons/settings-icon.vue'


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
.plv-container{
  display: flex;
  flex-direction: row;
  /* border: 1px solid white; */
  padding: 0;
  padding-top: .2rem;
}
.plv-leftpanel{
  display: flex;
  flex-direction: column;
  align-items: center;
  /* border: 1px solid white; */
  width: 9rem;

}
.plv-lp-img{
  width: 75%;
  padding-bottom: 75%;
  background-size: cover;
}

.plv-rightpanel{
  width: 75%;
  /* border: 1px solid white; */
}
.plv-rp-data-plname{
  font-family: 'Poppins Black';
  text-align: left;
  font-size: 1.5rem;
  line-height: .8;
}
.plv-rp-tracklist{
  /* height: 150%; */
  overflow-y: scroll;
}
</style>
