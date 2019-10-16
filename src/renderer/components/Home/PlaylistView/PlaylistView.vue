<template>
  <div class="home-router plv-container">
    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlist.images[0].url+')'" />
        <div class="controls">
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
            <button v-if="isSynced" class="button" @click="">Unsync</button>
          </div>

          <div v-if="isSynced" @click="toggleShowingAll" class="button thin">
            {{showingAll ? 'Collapse' : 'Show'}} all
          </div>
        </div>

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
          v-for="(track, index) in items"
          :key="index"
          :track="track"
          :conversion="giveMeConversion(track.id)"
          :convertionIsOpened="convertionIsOpened(track.id)"
          @toggleConversion="toggleConversion(track.id, $event)"
          @selectTrack="selectTrack(track.id, $event)"
          @openYtVideo="$emit('openYtVideo', $event)"
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
      showingConversion: [],
      showingAll: false,
      showingAdded: false,
      showingRemoved: false
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
    ammountOfTracksBeingShown () {
      return this.items.length + (this.showingAdded ? this.added.length : 0) + (this.showingRemoved ? this.removed.length : 0)
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
    items () {
      console.log('UPDATE DOU')
      return this.playlist.tracks.items
    },
    added () {
      return this.playlist.tracks.added
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
    toggleConversion (id, intention) {
      // Intention is what the toggle wants to do
      // Prevents funky things from happening when the showingConversion array gets empty
      for (let i = 0; i < this.showingConversion.length; i++) {
        if (this.showingConversion[i] === id) {
          this.showingConversion.splice(i, 1)
          console.log('dou! tt')
          if (this.showingConversion.length === 0 && intention !== this.showingAll) {
            this.toggleShowingAll()
          }
          return
        }
      }
      this.showingConversion.push(id)
      if (this.showingConversion.length === this.ammountOfTracksBeingShown && intention !== this.showingAll) {
        console.log('dou! ff')
        this.toggleShowingAll()
      }
    },
    toggleShowingAll () {
      this.showingAll = !this.showingAll
      this.showingConversion = []
    },
    convertionIsOpened (id) {
      if (this.showingConversion.length === 0) return this.showingAll
      for (let i = 0; i < this.showingConversion.length; i++) {
        if (this.showingConversion[i] === id) return !this.showingAll
      }
      return this.showingAll
    },
    selectTrack (trackId, newId) {
      console.log('dou')
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
  min-width: 8em;
  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding-bottom: .5em;
  }
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
