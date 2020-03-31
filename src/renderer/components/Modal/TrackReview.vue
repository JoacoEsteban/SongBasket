<template>
  <div class="track-review-container row">
    <Track :item="item" :isReviewing="true"/>

    <TrackResult :is-selected="convItem === item.selectionObj" @setSelection="setSelection(convItem)" v-for="(convItem, index) in conversions" :key="index" :item="convItem" :durationColor="durationColor(convItem)" />

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
    async setSelection (item) {
      if (item.id === this.item.selectionObj.id) return
      let newId = item.id
      if (item.isCustomTrack) newId = false
      if (item.isBestMatch) newId = null

      try {
        await this.$store.dispatch('changeYtTrackSelection', {trackId: this.item.id, newId})
        this.$controllers.track.populateTrackSelection(this.item)
      } catch (error) {
        console.error(error)
      }
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