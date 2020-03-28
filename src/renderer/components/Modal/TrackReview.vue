<template>
  <div class="track-review-container row">
    <Track :item="item" :isReviewing="true"/>
    <TrackResult v-for="(item, index) in conversions" :key="index" :item="item" :durationColor="durationColor(item)" />

    <div @click="selectCustomUrl" class="link-button">
      Use Custom URL
    </div>
  </div>
</template>

<script>
import Track from '../Home/PlaylistView/Track'
import TrackResult from '../Home/PlaylistView/TrackResult'
export default {
  props: {
    options: Object
  },
  computed: {
    item () {
      return this.options.tracks[this.options.index]
    },
    conversions () {
      console.log('aber', this.item)
      return this.item.conversion.yt.concat(this.item.custom || [])
    },
    min () {
      let min = Math.abs(this.conversions[0].durationDiff)
      this.conversions.forEach(({durationDiff}) => {
        durationDiff = Math.abs(durationDiff)
        if (durationDiff < min) min = durationDiff
      })
      return min
    },
    max () {
      let max = 0
      this.conversions.forEach(({durationDiff}) => {
        console.log(durationDiff)
        durationDiff = Math.abs(durationDiff)
        if (durationDiff > max) max = durationDiff
      })
      return max
    }
  },
  methods: {
    durationColor ({durationDiff}) {
      durationDiff = Math.abs(durationDiff)
      const deg = 150 - 150 * Math.abs(durationDiff / this.max)
      console.log(deg, durationDiff, this.max)
      return `hsl(${deg}, 100%, 50%)`
    },
    selectCustomUrl () {
      this.$root.OPEN_MODAL({wich: 'custom-track-url', payload: {trackId: this.item.id, playlistId: this.options.playlistId}})
    }
  },
  components: {
    Track,
    TrackResult
  },
  mounted () {
    console.log(this.options)
  }
}
</script>

<style lang="scss" scoped>
.track-review-container {
  width: 90vw;
  box-sizing: border-box;
  padding: .5em;
}
</style>