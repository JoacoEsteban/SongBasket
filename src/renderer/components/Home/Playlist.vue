<template>
    <div 
    :class="{'queued': isQueued, 'synced': isSynced}"
    class="pl-container">
        <div class="pl-track-count">
          {{playlist.tracks.total}} {{playlist.tracks.total === 1 ? 'Track' : 'Tracks'}}
          <div v-if="isSynced" class="star-icons-container">
            <div v-if="playlist.tracks.added && playlist.tracks.added.length > 0" class="star-icon">
              <div class="rotate">
                <star-icon color="#3f2" />
              </div>
              <div class="num">
                +{{playlist.tracks.added.length}}
              </div>
            </div>
            <div v-if="playlist.tracks.removed && playlist.tracks.removed.length > 0" class="star-icon">
              <div class="rotate">
                <star-icon color="#e33" />
              </div>
              <div class="num">
                -{{playlist.tracks.removed.length}}
              </div>
            </div>
          </div>
        </div>
        <div class="pl-img" :style="playlist.images.length > 0 ? {backgroundImage: `url(${playlist.images[0].url})`} : null">
          <div class="pl-button-container">
            <button class="button" @click="$emit('openPlaylist')">Explore</button>
            <button v-if="!isSynced" class="button" @click="addPlaylistToSyncQueue">{{isQueued ? 'Unqueue' : 'Queue'}}</button>
            <button v-if="isSynced" class="button" @click="unsync">Unsync</button>
          </div>
            <playlist-icon v-if="playlist.images.length === 0" />
        </div>
        <div class="pl-name" ref="plname">
            <!-- TODO handle multi line names -->
            {{playlistName}}
            
        </div>
        <div class="queued-indicator" />
    </div>
</template>

<script>
import 'vuex'

import PlaylistIcon from '../../assets/icons/playlist-icon'
import StarIcon from '../Icons/star-icon'

export default {
  props: {
    playlist: Object
  },
  data () {
    return {
      playlistName: this.$props.playlist.name
    }
  },
  computed: {
    isQueued () {
      return this.$store.getters.PlaylistIsQueued(this.playlist.id) >= 0
    },
    isSynced () {
      if (this.playlist) return this.$store.getters.PlaylistIsSynced(this.playlist.id)
      else return false
    }
  },
  methods: {
    addPlaylistToSyncQueue () {
      this.$store.dispatch('queuePlaylist', this.playlist.id)
    },
    unsync () {
      console.log('dou')
      this.$store._actions.openModal[0]({wich: 'unsync', payload: {id: this.playlist.id}})
    }
  },
  components: {
    PlaylistIcon,
    StarIcon
  }
}
</script>

<style lang="scss">
$q-false-color:#272727;
$q-true-color:rgb(103, 214, 0);
.pl-container {
  display: inline-block;
  position: relative;
  width: 8rem;
  background: $q-false-color;
  margin: 1.5rem 1.25rem;
  margin-top: 0;
  $transition: .2s cubic-bezier(.12,.82,0,.99);
  transition: transform $transition, background-color $transition, box-shadow $transition, outline-width .1s ease;
  color: #f0f0f0;
  box-shadow: .1em .1em .3em 0 rgba(0, 0, 0, 0.4);
  z-index: 0;
  
  $bg: darken($q-true-color, 7);
  $ol: var(--green-accept);
  $bezier: cubic-bezier(.31,.68,0,1);
  .queued-indicator {
    position: absolute;
    top: 100%;
    bottom: -.15em;
    right: 50%;
    left: 50%;
    pointer-events: none;
    z-index: -1;
    background: $ol;
    transition: all .2s $bezier;
  }
  &.queued {
    .queued-indicator {
      transition: all .4s $bezier;
      right: 0;
      left: 0;
    }
    transform: scale(1.08);
  }
  &.synced {
    .queued-indicator {
      transition: all .4s $bezier;
      right: -.15em;
      left: -.15em;
      top: -.15em;
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
  position: relative;
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
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0 .3rem;
  justify-content: space-evenly;
}
.pl-name {
  background: $q-false-color;
  text-align: left;
  font-size: .6rem;
  font-family: "Poppins Semibold";
  padding: 0 .2rem;
  height: 1.5rem;
  display: block;
  line-height: 1.5rem;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

}
.star-icons-container {
  position: absolute;
  display: flex;
  top: -1.1em;
  right: -1.2em;
  .star-icon {
    .rotate {
      @keyframes rotation {
        0% {transform: rotate(0deg)}
        100% {transform: rotate(180deg)}
      }
      height: 100%;
      // width: 100%;
      animation: rotation 4s linear infinite;
    }
    position: relative;
    $size: 2em;
    width: $size;
    height: $size;

    .num {
      font-size: .8em;
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
