<template>
  <div class="home-router plv-container">
    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlist.images[0].url+')'" />
      <button v-if="!isSynced" class="button" @click="$emit('addPlaylistToSyncQueue', playlist.id)">{{isQueued ? 'Unqueue' : 'Queue'}}</button>
      <button v-if="isSynced" class="button" @click="">Unsync</button>
      
    </div>
    <div class="plv-rightpanel">
      <div class="plv-rp-data">
        <div class="plv-rp-data-plname">{{playlist.name}}</div>
        <div class="plv-rp-data-byuser">by {{$store.state.CurrentUser.user.display_name}}</div>
      </div>
      <div class="plv-rp-tracklist">
        <Track v-for="(track, index) in playlist.tracks.items" :key="index" :track="track"
        @openYtVideo="$emit('openYtVideo', youtubeId(track.id))"
        />
      </div>
    </div>

  </div>
</template>

<script>
import 'vuex'
import Track from './Track'
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      // TODO make it work
    }
  },
  components: {
    Track
  },
  computed: {
    playlist () {
      return this.$store.getters.CurrentPlaylist
    },
    converted () {
      if (this.playlist) return this.$store.getters.SyncedPlaylist(this.playlist.id)
      else return null
    },
    isQueued () {
      if (this.playlist) return this.$store.getters.PlaylistIsQueued(this.playlist.id)
      else return false
    },
    isSynced () {
      if (this.playlist) return this.$store.getters.PlaylistIsSynced(this.playlist.id)
      else return false
    }

  },
  mounted () {
    console.log('PLAYLISTTTTT:::::', this.playlist)
  },
  methods: {
    searchOnYoutube (track) {
      ipc.send('Search Track', track)
    },
    youtubeId (id) {
      let c = this.converted.tracks
      for (let i = 0; i < c.length; i++) {
        if (c[i].id === id) return c[i].bestMatch
      }
      console.log('TRACK NOT FOUND')
      return null
    }
  }
}
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
  margin-bottom: 1rem;
}

.plv-rightpanel {
  width: 100%;
  display: flex;
  flex-direction: column;
  
  /* border: 1px solid white; */
}
.plv-rp-data {
  /* display: flex;
  flex-direction: column; */
  /* justify-content: space-evenly; */
  min-height: 3rem;
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
