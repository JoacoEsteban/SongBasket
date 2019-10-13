<template>
  <div class="home-router plv-container">
    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlist.images[0].url+')'" />

        <div class="df fldc alic">
          <span class="track-qty">
            <span>
              {{playlist.tracks.total}}
            </span>
              {{trackQty}}
          </span>
          <button
            v-if="!isSynced"
            class="button"
            @click="$emit('addPlaylistToSyncQueue', playlist.id)"
          >{{isQueued ? 'Unqueue' : 'Queue'}}</button>
        </div>

      <button v-if="isSynced" class="button" @click>Unsync</button>
    </div>
    <div class="plv-rightpanel">
      <div class="plv-rp-data">
        <div class="changes-container">
          <div v-if="added.length > 0" class="button accept thin">
            {{added.length}} tracks added
          </div>

          <div v-if="removed.length > 0" class="button cancel thin">
            {{removed.length}} tracks removed
          </div>
        </div>
        <div class="plv-rp-data-plname">{{playlist.name}}</div>
        <div class="plv-rp-data-byuser">by {{$store.state.CurrentUser.user.display_name}}</div>
      </div>
      <div class="plv-rp-tracklist">
        <Track
          v-for="(track, index) in playlist.tracks.items"
          :key="index"
          :track="track"
          :conversion="giveMeConversion(track.id)"
          @selectTrack="selectTrack(track.id, $event)"
          @openYtVideo="$emit('openYtVideo', youtubeId(track.id))"
        />
      </div>
    </div>
  </div>
</template>

<script>
import 'vuex'
import Track from './Track'

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
    conversion () {
      if (this.playlist) { return this.$store.getters.SyncedPlaylistById(this.playlist.id) } else return null
    },
    allTracks () {
      let tracks = this.playlist.tracks
      let items = tracks.items
      let removed = tracks.removed
      if (!removed) removed = []
      return [...items, ...removed]
    },
    isQueued () {
      if (this.playlist) { return this.$store.getters.PlaylistIsQueued(this.playlist.id) >= 0 } else return false
    },
    isSynced () {
      if (this.playlist) { return this.$store.getters.PlaylistIsSynced(this.playlist.id) } else return false
    },
    trackQty () {
      return ' Track' + (this.playlist.tracks.total === 1 ? '' : 's')
    },
    added () {
      return this.playlist.tracks.added ? this.playlist.tracks.added : []
    },
    removed () {
      return this.playlist.tracks.removed
    }
  },
  mounted () {
    console.log('PLAYLISTTTTT:::::', this.playlist)
  },
  methods: {
    youtubeId (id) {
      let c = this.conversion.tracks
      for (let i = 0; i < c.length; i++) {
        if (c[i].id === id) return c[i].bestMatch
      }
      console.log('TRACK NOT FOUND')
      return null
    },
    giveMeConversion (id) {
      if (!this.isSynced) return null
      let tracks = this.conversion.tracks
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i]
        if (track.id === id) return track
      }
    },
    selectTrack (trackId, newId) {
      this.$store.dispatch('changeYtTrackSelection', {playlist: this.playlist.id, trackId, newId})
    }
  }
}
</script>

<style lang="scss" scoped>
.plv-container {
  display: flex;
  flex-direction: row;
  /* border: 1px solid white; */
  padding: 0;
}
.plv-leftpanel {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* border: 1px solid white; */
  padding-top: .5em;
  min-width: 7em;
}
.plv-lp-img {
  background-size: cover;
  width: 92%;
  padding-bottom: 92%;
  margin-bottom: .3em;
}
.track-qty {
  font-size: .6em;
  > span {
    font-family: "Poppins Bold"
  }
}
.plv-rightpanel {
  width: 100%;
  display: flex;
  flex-direction: column;

  /* border: 1px solid white; */
}
.plv-rp-data {
  background-color: var(--global-grey-secondary);
  position: relative;
  padding: .5em;
  min-height: 3em;
}

.changes-container {
  $size:2em;
  bottom: $size / -2;
  left: 0;
  right: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: $size;
  pointer-events: none;

  > div {
    pointer-events: all;
    margin: 0 .5em;
    padding: .3em 2em;
    font-size: .7em;
    font-family: "Poppins SemiBold";
    z-index: 1;
  }
}

.plv-rp-data-plname {
  font-family: "Poppins Black";
  text-align: left;
  font-size: 1.5em;
  line-height: 1;
}
.plv-rp-data-byuser {
  font-family: "poppins regular";
  text-align: left;
  font-size: 0.9em;
  line-height: 1.3;
}
.plv-rp-tracklist {
  /* height: 150%; */
  padding: 0 .5em;
  overflow-y: scroll;
}
</style>
