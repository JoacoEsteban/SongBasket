<template>
  <Card :item="itemFormatted" row-classes="col-lg-6 col-md-12 col-xs-12" :options="cardOptions">
    <div class="w100 point75-em">
      <div class="ellipsis">
        <span class="bold">
          {{item.name}}
        </span>
      </div>
      <div class="ellipsis">
        <span class="regular">
          {{trackController.getArtists(item)}}
        </span>
      </div>
    </div>
  </Card>
</template>

<script>
import Card from '../Generic/Card'

export default {
  props: {
    item: {
      Object,
      required: true
    }
  },
  components: {
    Card
  },
  computed: {
    itemFormatted () {
      return (this.item && {
        ...this.item,
        backgroundImage: this.item.album && this.item.album.images && this.item.album.images[0] && this.item.album.images[0].url
      }) || {}
    }
  },
  data () {
    return {
      cardOptions: {
        height: '2em',
        xRotationFactor: 0.01,
        hovScaleFactor: 1
      },
      trackController: {
        getArtists: (item) => item.artists.map(({name}) => name).join(', ')
      }
    }
  }
}
</script>


<style lang="scss" scoped>

</style>