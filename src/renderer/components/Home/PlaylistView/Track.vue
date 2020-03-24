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
        
        <span class="bold uppercase point75-em" :style="{color: trackData.status.color}">
          {{trackData.status.str}}
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
    isNew: Boolean
  },
  components: {
    Card
  },
  computed: {
    itemFormatted () {
      const album = this.item.album || this.item.data.album
      const itm = this.item
      return (itm && {
        ...itm,
        selection: itm.conversion && itm.conversion.yt.find(yt => yt.id === (itm.playlists.find(p => p.id === this.playlistId).selected || itm.conversion.bestMatch)),
        backgroundImage: album && album.images && album.images[0] && album.images[0].url
      }) || {}
    }
  },
  methods: {
    calcStatus () {
      this.trackData.status = this.trackController.getStatus(this.itemFormatted)
    }
  },
  mounted () {
    this.calcStatus()
  },
  data () {
    return {
      cardOptions: {
        height: '2.5em',
        xRotationFactor: 0.01,
        hovScaleFactor: 1,
        paddingY: '.5em',
        paddingX: '.5em'
      },
      playlistId: this.$sbRouter.giveMeCurrent().params.id,
      trackData: {
        status: {
          slug: '',
          color: '',
          str: ''
        }
      },
      trackController: this.$controllers.track
    }
  }
}
</script>


<style lang="scss" scoped>

</style>