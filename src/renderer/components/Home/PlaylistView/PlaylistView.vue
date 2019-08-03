<template>
  <div class="home-router plv-container">
    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlist.images[0].url+')'"></div>
    </div>
    <div class="plv-rightpanel">
      <div class="plv-rp-data">
        <div class="plv-rp-data-plname">{{playlist.name}}</div>
        <div class="plv-rp-data-byuser">by {{$store.state.CurrentUser.user.display_name}}</div>
      </div>
      <div class="plv-rp-tracklist">
        <Track v-for="(track, index) in playlist.tracks.items" :key="index" :track="track" />
      </div>
    </div>

    <!-- <div v-for="(song, index) in playlist.tracks.items" :key="index"> {{song.track.name}} </div> -->
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;
import "vuex";
import Track from "./Track";

export default {
  data() {
    return {
      //TODO make it work
    };
  },
  components: {
    Track
  },
  computed: {
    playlist() {
      return this.$store.getters.CurrentPlaylist;
    }
  },
  mounted() {
    console.log("PLAYLISTTTTT:::::", this.playlist);
  }
};
</script>

<style>
.plv-container {
  display: flex;
  flex-direction: row;
  /* border: 1px solid white; */
  padding: 0;
  padding-top: 0.4rem;
}
.plv-leftpanel {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* border: 1px solid white; */
  min-width: 7rem;
}
.plv-lp-img {
  background-size: cover;
  width: 92%;
  padding-bottom: 92%;
}

.plv-rightpanel {
  width: 100%;
  display: flex;
  flex-direction: column;
  
  /* border: 1px solid white; */
}
.plv-rp-data-plname {
  font-family: "Poppins Black";
  text-align: left;
  font-size: 1.5rem;
  line-height: 1;
}
.plv-rp-data-byuser {
  font-family: "poppins regular";
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.3;
}
.plv-rp-tracklist {
  /* height: 150%; */
  overflow-y: scroll;
}
</style>
