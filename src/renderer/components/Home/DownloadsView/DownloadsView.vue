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
      return this.$store.state.CurrentUser.convertedTracks.slice(0, 10)
    },
    currentTrackDownload () {
      return this.$store.state.Events.CURRENT_DOWNLOAD
    }
  },
  methods: {
    giveMeTrackDownloadStatus (track, index) {
      if (index > 0 && this.currentTrackDownload.id !== track.id) return {state: 'awaiting'}
      // return this.currentTrackDownload
      return {
        id: null,
        state: 'downloading',
        ptg: 74,
        label: 'downloading 74%'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .banner-list {
    position: relative;
  }
</style>