<template>
  <div class="track-review-container row">
    <Track :item="item" :isReviewing="true"/>
    <TrackResult v-for="(item, index) in conversions" :key="index" :item="item" :durationColor="durationColor(item)" />
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
      return this.item.conversion.yt
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