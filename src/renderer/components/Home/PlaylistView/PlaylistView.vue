<template>
  <div class="plv-container w100">
    <div class="track-list row">

      <div class="changes-container" v-if="isSynced">
        <div class="mb-1" v-if="added.length">
          <div class="list">
            <div class="label-container">
              <span class="point75-em">
                Added <span class="color-green">+{{added.length}}</span>
              </span>
            </div>
          </div>
          <div class="horizontal-scroller pt-0">
            <Track v-for="(item, index) in added" :isNew="true" :item="item" :key="index" />
          </div>
        </div>

        <div class="mb-1" v-if="removed.length">
          <div class="list">
            <div class="label-container">
              <span class="point75-em">
                Removed <span class="color-red">-{{removed.length}}</span>
              </span>
            </div>
          </div>
          <div class="horizontal-scroller pt-0">
            <Track v-for="(item, index) in removed" :isRemoved="true" :item="item" :key="index" />
          </div>
        </div>
      </div>

      <div class="list">
        <Track v-for="(item, index) in (isSynced ? conversion : items)" :item="item" :key="index"
          @review-track="reviewTrack(item)"
        />
      </div>
    </div>
    <!-- <div class="track-review-container row">
      track review xd
    </div> -->
  </div>
</template>

<script>
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
    currentPlaylist: String
  },
  computed: {
    playlistImage () {
      return this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    isSynced () {
      if (this.playlist) {
        return this.$store.getters.PlaylistIsSynced(this.currentPlaylist)
      } else {
        return false
      }
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
    playlistTracksReComputed () {
      return this.$store.state.Events.PLAYLIST_TRACKS_RE_COMPUTED
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
    playlistTracksReComputed () {
      // this.refreshPlaylist()
      console.log('EVENT FROM PLVIEW')
      this.computeTracks()
    },
    playlistUnsynced () {
      this.$sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
    }
  },
  mounted () {
    this.refreshPlaylist()
    this.computeTracks()
    this.$root.PlaylistViewInstance = this
    window.plViewDebug = this
  },
  destroyed () {
    console.log('exitexit')
  },
  methods: {
    refreshPlaylist () {
      this.playlist = this.$store.getters.PlaylistById(this.currentPlaylist) || {}
    },
    computeTracks () {
      this.conversion = (this.$root.CONVERTED_TRACKS_FORMATTED && this.$root.CONVERTED_TRACKS_FORMATTED.filter(t => t.playlists.some(pl => pl.id === this.currentPlaylist)).sort(this.$controllers.track.sort)) || []
    },
    reviewTrack (track) {
      this.$root.OPEN_MODAL({
        wich: 'track-review',
        payload: { tracks: this.conversion, index: this.conversion.indexOf(track), playlistId: this.currentPlaylist }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.track-list {
  --card-padding-x: .5em;
  --padding-x: 1em;
  width: 100%;
  overflow: hidden;
  padding: var(--padding-x) 0;
  padding-top: 0;
  box-sizing: border-box;
  .list {
    padding: 0 var(--padding-x);
  }
}

.changes-container {
  .label-container {
    font-weight: bold;
    text-transform: uppercase;
    text-align: left;
    padding-left: calc(.3em + var(--card-padding-x));
  }
}
</style>
