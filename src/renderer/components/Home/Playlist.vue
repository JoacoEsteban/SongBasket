<template>
    <div 
    :class="{'queued': queued}"
    class="pl-container">
        <div class="pl-track-count">{{playlist.tracks.total}} {{playlist.tracks.total === 1 ? 'Track' : 'Tracks'}}</div>
        <div class="pl-img" :style="playlist.images.length > 0 ? {backgroundImage: `url(${playlist.images[0].url})`} : null">
          <div class="pl-button-container">
            <button class="button" @click="$emit('openPlaylist')">Explore</button>
            <button class="button" @click="$emit('addPlaylistToSyncQueue')">{{queued ? 'Unqueue' : 'Queue'}}</button>
          </div>
            <playlist-icon v-if="playlist.images.length === 0" />
        </div>
        <div class="pl-name" ref="plname">
            <!-- TODO handle multi line names -->
            {{playlistName}}
        </div>
    </div>
</template>

<script>
import 'vuex'

import electron from 'electron'
import PlaylistIcon from '../../assets/icons/playlist-icon'
const ipc = electron.ipcRenderer

export default {
  props: {
    playlist: Object
  },
  data () {
    return {
      playlistName: this.$props.playlist.name.length > 20 ? this.$props.playlist.name.substring(0, 20) + '...' : this.$props.playlist.name
    }
  },
  computed: {
    queued () {
      return this.$store.getters.PlaylistIsQueued(this.playlist.id)
    }

  },
  mounted () {
    ipc.on(`hola ${this.playlist.id}`, () => {
      console.log('Recibido Compa: ', this.playlist.name, this.playlist.id)
    })
  },
  components: {
    PlaylistIcon
  },
  methods: {
  }
}
</script>

<style lang="scss">
$q-false-color:#272727;
$q-true-color:rgb(103, 214, 0);
.pl-container {
  display: inline-block;
  width: 8rem;
  background: $q-false-color;
  margin: 0 1rem 1.4rem 1rem;
  transition: transform .2s ease, background-color .2s ease, outline-width .1s ease;
  color: #f0f0f0;
  
  &.queued {
    $bg: darken($q-true-color, 7);
    $ol: $q-true-color;
    outline: 3px solid $ol;
    // background: $bg;
    transform: scale(1.07);
    .pl-track-count {
      // background: $bg
    }
  }

  &:hover {
      transform: scale(1.1);
  }
}
.pl-track-count {
    position: relative;
    box-sizing: border-box;
    text-align: center;
    font-size: .6rem;
    width: 8rem;
    height: 1rem;
    background-color: $q-false-color;
    font-family: "Poppins Semibold";

    background-color: $q-false-color;
}
.pl-img {
    width: 8rem;
    height: 8rem;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: #2e2e2e;

    background-position: center;
    background-size: cover;
}
.pl-button-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0 .3rem;
  justify-content: space-evenly;
}
.pl-name {
    text-align: left;
    font-size: .6rem;
    font-family: "Poppins Semibold";
    padding: 0 .2rem;
    height: 1.5rem;
    display: flex;
    align-items: center;

}
</style>
