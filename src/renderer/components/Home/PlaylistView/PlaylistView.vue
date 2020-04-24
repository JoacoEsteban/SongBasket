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
    currentPlaylist: String
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
    },
    doubtfulTracks () {
      return this.conversion.filter(t => t.selectionObj && t.selectionObj.isDoubtlyConversion)
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
      console.log('unsynced from event')
      this.$sbRouter.push({name: 'home', params: {which: 'playlists-list'}})
    },
    resetSelection () {
      this.resetAll(true)
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
      this.$root.CURRENT_PLAYLSIT_OBJ = this.playlist
    },
    reviewTrack (track) {
      this.$root.OPEN_MODAL({
        wich: 'track-review',
        payload: { tracks: this.conversion, index: this.conversion.indexOf(track), playlistId: this.currentPlaylist }
      })
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
      this.conversion = this.$store.state.CurrentUser.convertedTracks.filter(t => t.playlists.some(pl => pl.id === this.currentPlaylist)).map(track => {
        const cloned = {...track}
        this.$controllers.track.populateTrackSelection(cloned)
        if (!cloned.selectionObj) console.log(cloned)
        cloned.status = this.$controllers.track.getStatus(cloned)
        return cloned
      }).sort(this.$controllers.track.sort)
    },
    youtubeId (id) {
      let c = this.conversion.tracks
      for (let i = 0; i < c.length; i++) {
        if (c[i].id === id) return c[i].bestMatch
      }
      console.log('TRACK NOT FOUND')
      return null
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
      if (!confirm) return this.$root.OPEN_MODAL({wich: 'reset-all-playlist-tracks', payload: {playlistId: this.playlist.id}})
      this.conversion.forEach(track => {
        this.$store.dispatch('changeYtTrackSelection', {playlist: this.playlist.id, trackId: track.id, newId: null})
      })
      setTimeout(() => {
        this.$forceUpdate()
      }, 0)
    },
    selectTrack (trackId, newId) {
      this.$store.dispatch('changeYtTrackSelection', {playlist: this.playlist.id, trackId, newId})
    },
    customTrackUrl (trackId) {
      this.$root.OPEN_MODAL({wich: 'custom-track-url', payload: {trackId, playlistId: this.playlist.id}})
    },
    unsync () {
      this.$store.dispatch('openModal', {wich: 'unsync', payload: {id: this.playlist.id}})
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
