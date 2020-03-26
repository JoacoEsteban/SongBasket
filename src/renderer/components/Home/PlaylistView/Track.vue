<template>
  <Card :item="itemFormatted" row-classes="col-lg-3 col-md-4 col-s-6 col-xs-12" :options="cardOptions">
    <div class="w100 point75-em">
      <div class="ellipsis">
        <span class="bold">
          {{itemFormatted.name || itemFormatted.data.name}}
        </span>
      </div>
      <div class="ellipsis">
        <span class="regular point75-em">
          {{trackController.getArtists(itemFormatted)}}
        </span>
      </div>
      <div class="ellipsis track-status">
        <span class="bold uppercase point75-em color-green" v-if="isNew">
          new
        </span>
        <span class="bold uppercase point75-em color-red" v-if="isRemoved">
          removed
        </span>
        
        <span class="bold uppercase point75-em" v-if="itemFormatted.status" :style="{color: itemFormatted.status.color}">
          {{itemFormatted.status.str}}
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
    },
    isNew: Boolean,
    isRemoved: Boolean
  },
  components: {
    Card
  },
  computed: {
    itemFormatted () {
      const album = this.item.album || this.item.data.album
      return (this.item && {
        ...this.item,
        backgroundImage: album && album.images && album.images[0] && album.images[0].url
      }) || {}
    }
  },
  methods: {
  },
  data () {
    return {
      cardOptions: {
        height: '2.5em',
        xRotationFactor: 0.01,
        hovScaleFactor: false,
        paddingY: '.5em',
        paddingX: 'var(--card-padding-x)',
        size: this.isNew || this.isRemoved ? '.8em' : ''
      },
      trackController: this.$controllers.track
    }
  }
}
</script>


<style lang="scss" scoped>

</style>