<template>
  <div class="track-review-container">
    <div class="container-fluid text-left pt-2" style="--px: 2em">
      <div class="default-title" style="--fz: 1.2em">
        Conversions
      </div>
    </div>
    <div class="conversions-list" v-if="track">
      <track-banner v-for="(item, index) in conversions" :track="item" :key="index" :is-conversion="true"></track-banner>
    </div>
  </div>
</template>

<script>
import TrackBanner from '../DownloadsView/TrackBanner'
export default {
  components: {
    TrackBanner
  },
  data () {
    return {
      track: null
    }
  },
  props: {
    refresh: Boolean
  },
  computed: {
    conversions () {
      return this.track && this.track.conversion.yt
    }
  },
  methods: {
    refreshTrack () {
      this.track = this.$sbRouter.giveMeCurrent().params.track
      this.$ComponentRefs.slides.TrackReview.setTrack(this.track)
      console.log(this.track)
    }
  },
  watch: {
    refresh (val) {
      if (!val) return
      this.refreshTrack()
    }
  }
}
</script>

<style lang="scss" scoped>
.track-review-container {
  width: 100%;
  max-width: 100vw;
}
.parent-track-container {
  position: sticky;
  top: 0;
}
</style>