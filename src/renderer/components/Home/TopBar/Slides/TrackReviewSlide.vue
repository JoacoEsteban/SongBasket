<template>
  <div class="track-review-slide-container">
    <track-banner class="parent-track-container" v-if="track" :track="track"></track-banner>
  </div>
</template>

<script>
import TrackBanner from '../../DownloadsView/TrackBanner'
export default {
  components: {
    TrackBanner
  },
  data () {
    return {
      track: null
    }
  },
  created () {
    this.$ComponentRefs.slides.TrackReview = this
  },
  methods: {
    setTrack (track) {
      this.track = track
    }
  }
}
</script>

<style lang="scss" scoped>
.track-review-slide-container {
  padding-top: var(--tb-title-height)
}
</style>