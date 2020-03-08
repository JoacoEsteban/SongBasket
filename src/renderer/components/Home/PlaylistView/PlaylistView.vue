<template>
  <div class="plv-container">
    <div class="plv-leftpanel">
      <div class="plv-lp-img" :style="'background-image: url('+playlistImage+')'" />
        <div class="controls">
          <div class="df fldc alic">
            <span class="track-qty">
              <span>
                {{playlistTotalTracks}}
              </span>
                {{trackQty}}
            </span>
            <button
              v-if="!isSynced"
              class="button"
              @click="$emit('addPlaylistToSyncQueue', playlist.id)"
            >{{isQueued ? 'Unqueue' : 'Queue'}}</button>
            <button v-if="isSynced" class="button" @click="unsync">Unsync</button>
          </div>

          <div>
            <div v-if="isSynced" @click="toggleShowingAll" class="button slim mb-1">
              {{showingAll ? 'Collapse' : 'Show'}} all
            </div>
            <div v-if="isSynced" @click="resetAll()" class="button slim">
              Reset all
            </div>
          </div>
        </div>

    </div>
    <div class="plv-rightpanel">
      <div class="plv-rp-data">
        <div class="changes-container">
          <div
          @click="toggle('added')"
          v-if="added.length > 0" class="button accept thin">
            {{added.length + ' ' + (added.length === 1 ? 'track' : 'tracks')}} added
          </div>
          <div
          @click="toggle('removed')"
          v-if="removed.length > 0" class="button cancel thin">
            {{removed.length + ' ' + (removed.length === 1 ? 'track' : 'tracks')}} removed
          </div>
        </div>
        <!-- <div class="plv-rp-data-plname">{{playlist.name}}</div>
        <div class="plv-rp-data-byuser">by {{playlistOwner}}</div> -->
      </div>
      <div class="plv-rp-tracklist" ref="tracklist-scroll">
        <div
        :class="{'hide': !showing.added || added.length === 0}"
        ref="added"
        class="added changes-tracks-container">
          <Track
            v-for="(track, index) in added"
            :key="index"
            :track="track"
          />
        </div>
        <div
        :class="{'hide': !showing.removed || removed.length === 0}"
        ref="removed"
        class="removed changes-tracks-container">
          <Track
            :isRemoved="true"
            v-for="(track, index) in removed"
            :key="index"
            :track="track"
            :conversion="giveMeConversion(track.id)"
            :convertionIsOpened="convertionIsOpened(track.id)"
            @toggleConversion="toggleConversion(track.id, $event)"
            @openYtVideo="$emit('openYtVideo', $event)"
          />
        </div>
        <Track
          v-for="(track, index) in items"
          :key="index"
          :track="track"
          :conversion="giveMeConversion(track.id)"
          :convertionIsOpened="convertionIsOpened(track.id)"
          @toggleConversion="toggleConversion(track.id, $event)"
          @selectTrack="selectTrack(track.id, $event)"
          @customTrackUrl="customTrackUrl(track.id)"
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
      conversion: [],
      showingConversion: [],
      showingAll: false,
      showing: {
        added: false,
        removed: false
      },
      playlist: {}
    }
  },
  components: {
    Track
  },
  props: {
    currentPlaylist: {
      type: String,
      required: false,
      default: null
    }
  },
  computed: {
    playlistImage () {
      return this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    playlistOwner () {
      return this.playlist.owner && this.playlist.owner.display_name
    },
    playlistTotalTracks () {
      return this.playlist.tracks && this.playlist.tracks.total
    },
    // currentPlaylist () {
    //   return this.$store.state.CurrentUser.currentPlaylist
    // },
    ammountOfTracksBeingShown () {
      return this.items.length + (this.showing.added ? this.added.length : 0) + (this.showing.removed ? this.removed.length : 0)
    },
    isQueued () {
      if (this.playlist) { return this.$store.getters.PlaylistIsQueued(this.playlist.id) >= 0 } else return false
    },
    isSynced () {
      if (this.playlist) {
        return this.$store.getters.PlaylistIsSynced(this.currentPlaylist)
      } else {
        return false
      }
    },
    trackQty () {
      return ' Track' + (this.playlist.tracks && this.playlist.tracks.total === 1 ? '' : 's')
    },
    items () {
      return this.playlist.tracks && this.playlist.tracks.items
    },
    added () {
      return (this.playlist && this.playlist.tracks && this.playlist.tracks.added) || 0
    },
    removed () {
      return (this.playlist && this.playlist.tracks && this.playlist.tracks.removed) || 0
    },
    syncedPlaylistsRefreshed () {
      return this.$store.state.Events.SYNCED_PLAYLISTS_REFRESHED
    },
    playlistUnsynced () {
      return this.$store.state.Events.PLAYLIST_UNSYNCED
    },
    resetSelection () {
      return this.$store.state.Events.RESET_SELECTION
    }
  },
  watch: {
    currentPlaylist () {
      this.refreshPlaylist()
      this.computeTracks()
    },
    syncedPlaylistsRefreshed () {
      this.refreshPlaylist()
      this.computeTracks()
    },
    playlistUnsynced () {
      this.$sbRouter.push('home')
    },
    resetSelection () {
      this.resetAll(true)
    }
  },
  mounted () {
    console.log('PLAYLISTTTTT:::::', this.playlist)
    this.computeTracks()
    this.refreshPlaylist()
    window.plViewDebug = this
  },
  destroyed () {
    console.log('exitexit')
  },
  methods: {
    refreshPlaylist () {
      this.playlist = this.$store.getters.PlaylistById(this.currentPlaylist) || {}
      this.$root.CURRENT_PLAYLSIT_OBJ = this.playlist
    },
    toggle (wich) {
      this.showing[wich] = !this.showing[wich]
      switch (this.showing[wich]) {
        case true:
          this.$refs[wich].style.height = this.$refs[wich].scrollHeight + 'px'
          setTimeout(() => {
            if (this.showing[wich]) this.$refs[wich].style.height = 'initial'
          }, 500)
          this.$refs['tracklist-scroll'].scrollTo({top: 0, behavior: 'smooth'})
          break
        case false:
          this.$refs[wich].style.height = this.$refs[wich].scrollHeight + 'px'
          setTimeout(() => {
            this.$refs[wich].style.height = 0 + 'px'
          }, 100)
          break
      }
    },
    computeTracks () {
      console.log('computing', this.isSynced)
      if (!this.isSynced) return
      let allTracks = this.$store.state.CurrentUser.convertedTracks
      console.log('alltracks', allTracks)
      let plTracks = []

      for (let i = 0; i < allTracks.length; i++) {
        let track = allTracks[i]
        if (track.playlists.some(pl => pl.id === this.currentPlaylist)) {
          plTracks.push(track)
        }
      }

      this.conversion = plTracks
    },
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
      let tracks = this.conversion
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i]
        if (track.id === id) {
          return track
        }
      }
    },
    toggleConversion (id, intention) {
      // Intention is what the toggle wants to do
      // Prevents funky things from happening when the showingConversion array gets empty
      for (let i = 0; i < this.showingConversion.length; i++) {
        if (this.showingConversion[i] === id) {
          this.showingConversion.splice(i, 1)
          if (this.showingConversion.length === 0 && intention !== this.showingAll) {
            this.toggleShowingAll()
          }
          return
        }
      }
      this.showingConversion.push(id)
      if (this.showingConversion.length === this.ammountOfTracksBeingShown && intention !== this.showingAll) {
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
    resetAll (confirm) {
      // TODO Request confirmation
      if (confirm) {
        this.conversion.forEach(track => {
          this.$store.dispatch('changeYtTrackSelection', {playlist: this.playlist.id, trackId: track.id, newId: null})
        })
        setTimeout(() => {
          this.$forceUpdate()
        }, 0)
      } else this.$store._actions.openModal[0]({wich: 'reset-all-playlist-tracks', payload: {playlistId: this.playlist.id}})
    },
    selectTrack (trackId, newId) {
      this.$store.dispatch('changeYtTrackSelection', {playlist: this.playlist.id, trackId, newId})
    },
    customTrackUrl (trackId) {
      this.$store._actions.openModal[0]({wich: 'custom-track-url', payload: {trackId, playlistId: this.playlist.id}})
    },
    unsync () {
      this.$store.dispatch('openModal', {wich: 'unsync', payload: {id: this.playlist.id}})
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
  width: 100%;
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
  min-width: 0;

  /* border: 1px solid white; */
}
.plv-rp-data {
  // background-color: var(--global-grey-secondary);
  position: relative;
  // padding: .5em;
  // min-height: 3em;
  z-index: 1;
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
  z-index: 0;
  padding: 0 .5em;
  overflow-y: scroll;

  .changes-tracks-container {
    padding: 1px .5em;
    height: 0px;
    border-radius: .2em;
    margin: .3em 0;
    $transition: .5s cubic-bezier(.12,.82,0,.99);
    transition: height $transition, margin $transition, opacity $transition;
    &.added {
      background-color: var(--green-accept);
    }
    &.removed {
      background-color: var(--red-cancel);
    }

    &.hide {
      opacity: 0;
      margin: 0;
    }
  }
}
</style>
