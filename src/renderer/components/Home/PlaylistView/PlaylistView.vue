<template>
  <div class="plv-container w100">
    <div class="track-list row">
      <div class="dcontents" v-if="isSynced">
        <Track v-for="(item, index) in added" :isNew="true" :item="item" :key="index" />
      </div>
      <Track v-for="(item, index) in (isSynced ? conversion : items)" :item="item" :key="index" />
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
    this.refreshPlaylist()
    this.computeTracks()
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
      this.conversion = this.$store.state.CurrentUser.convertedTracks.filter(t => t.playlists.some(pl => pl.id === this.currentPlaylist))
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
      return this.conversion.find(t => t.id === id)
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
      if (!confirm) return this.$store._actions.openModal[0]({wich: 'reset-all-playlist-tracks', payload: {playlistId: this.playlist.id}})
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
      this.$store._actions.openModal[0]({wich: 'custom-track-url', payload: {trackId, playlistId: this.playlist.id}})
    },
    unsync () {
      this.$store.dispatch('openModal', {wich: 'unsync', payload: {id: this.playlist.id}})
    }
  }
}
</script>

<style lang="scss" scoped>
.track-list {
  width: 100%;
  overflow: hidden;
  padding: 1em;
  padding-top: 0;
  box-sizing: border-box;
}
</style>
