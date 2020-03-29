<template>
  <div class="track-review-container row">
    <Track :item="item" :isReviewing="true"/>

    <TrackResult :is-selected="convItem === item.selection" @setSelection="setSelection(convItem)" v-for="(convItem, index) in conversions" :key="index" :item="convItem" :durationColor="durationColor(convItem)" />

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
      return `hsl(${deg}, 100%, 50%)`
    },
    selectCustomUrl () {
      this.$root.OPEN_MODAL({wich: 'custom-track-url', payload: {trackId: this.item.id, playlistId: this.options.playlistId}})
    },
    setSelection (item) {
      if (item.id === this.item.selection.id) return
      let newId = item.id
      if (item.isCustomTrack) newId = false

      this.$store.dispatch('changeYtTrackSelection', {playlist: this.options.playlistId, trackId: this.item.id, newId})
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