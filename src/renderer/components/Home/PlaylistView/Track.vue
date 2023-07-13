<template>
  <Card :item="itemFormatted" :row-classes="rowClasses" :options="cardOptions" @click="handleClick">
    <div class="w100 point75-em">
      <div class="ellipsis">
        <span class="bold">
          {{ itemFormatted.name || itemFormatted.data.name }}
        </span>
      </div>
      <div class="ellipsis">
        <span class="regular point75-em">
          {{ trackController.getArtistsString(itemFormatted) }}
        </span>
      </div>
      <div class="ellipsis track-status">
        <span class="bold uppercase point75-em color-green" v-if="isNew">
          new
        </span>
        <span class="bold uppercase point75-em color-red" v-if="isRemoved">
          removed
        </span>

        <span class="bold uppercase point75-em" v-if="itemFormatted.status"
          :style="{ color: itemFormatted.status.color }">
          {{ itemFormatted.status.str }}
        </span>
      </div>
    </div>
  </Card>
</template>

<script lang="ts">
import Card from '../Generic/Card.vue'

export default {
  props: {
    item: {
      Object,
      required: true
    },
    isNew: Boolean,
    isRemoved: Boolean,
    isReviewing: Boolean
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
    getCallback () {
      const status = this.item.status && this.item.status.slug
      switch (status) {
        case 'awaiting-download':
        case 'downloaded':
        case 'custom:awaiting-download':
        case 'review-conversion':
        case 'no-conversion':
        case 'paused':
          return this.reviewTrack
        case 'error':
        default:
          return null
      }
    },
    handleClick () {
      if (this.clickCB === undefined) this.clickCB = this.getCallback()
      console.log(this.clickCB)
      typeof this.clickCB === 'function' && this.clickCB()
    },
    reviewTrack () {
      this.$root.$controllers.core.reviewTrack(this.item)
    }
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
      rowClasses: this.isReviewing ? 'col-sm-12' : 'col-lg-3 col-md-4 col-s-6 col-xs-12',
      trackController: this.$root.$controllers.track,
      clickCB: undefined
    }
  }
}
</script>


<style lang="scss" scoped></style>