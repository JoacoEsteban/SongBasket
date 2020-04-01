<template>
  <div class="w100">
    <div class="banner-list w100">
      <track-banner :download-status="giveMeTrackDownloadStatus(track, index)" :is-download="true" v-for="(track, index) in downloads" :key="index" :track="track"></track-banner>
    </div>
  </div>
</template>

<script>
import TrackBanner from './TrackBanner'
export default {
  components: {
    TrackBanner
  },
  computed: {
    downloads () {
      return (this.$store.state.Events.DOWNLOAD_QUEUE || []).map(t => this.$store.state.CurrentUser.convertedTracks.find(track => t.id === track.id))
    },
    currentTrackDownload () {
      return this.$store.state.Events.CURRENT_DOWNLOAD
    }
  },
  methods: {
    giveMeTrackDownloadStatus (track) {
      // if (this.currentTrackDownload !== track.id) return {state: 'awaiting'}
      return this.$store.state.Events.DOWNLOAD_QUEUE.find(t => t.id === track.id)
    }
  }
}
</script>

<style lang="scss" scoped>
  .banner-list {
    position: relative;
  }
</style>