<template>
  <div class="track-review-container">
    <div class="container-fluid text-left pt-2" style="--px: 2em">
      <div class="default-title text-secondary" style="--fz: 1.2em">
        Conversions
      </div>
    </div>
    <div class="conversions-list" v-if="track">
      <track-banner
        v-for="(item, index) in conversions"
        :track="item"
        :parent-ref="track"
        :key="index"
        :is-conversion="true"
        :is-selected="isSelected(item.youtube_id)"
        @select="selectVideo(item)"
        ></track-banner>
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
      let convs = this.track && this.track.conversion.yt
      if (this.track.custom) convs = [this.track.custom, ...(convs || [])]
      return convs
    },
    selection () {
      return this.track.selectionObj.id
    }
  },
  created () {
    this.$ComponentRefs.TrackReview = this
  },
  methods: {
    refreshTrack () {
      const track = this.$sbRouter.giveMeCurrent().params.track
      if (!track) return
      this.track = this.$root.CONVERTED_TRACKS_FORMATTED.find(t => t.id === track.id)
      this.$ComponentRefs.slides.TrackReview.setTrack(this.track)
      console.log(this.track)
    },
    isSelected (id) {
      return this.selection === id
    },
    async selectVideo (item) {
      try {
        const newId = (item === null || item === false) ? item : item.youtube_id
        if (newId === undefined || !this.track) throw new Error('NO TRACK')
        await this.$controllers.core.changeYtTrackSelection({trackId: this.track.id, newId})
        this.refreshTrack()
      } catch (error) {
        throw error
      }
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