<template>
  <Card :item="itemFormatted" :row-classes="rowClasses" :options="cardOptions" @click="handleClick">
    <div class="w100 point75-em df alic">
      <div class="ellipsis pr-2">
        <div class="issue color-red point75-em semibold">{{itemFormatted.issue}}</div>
        <div class="ellipsis">
          <span class="">
            {{itemFormatted.name}}
          </span>
        </div>
        <div class="ellipsis">
          <span class="regular point75-em">
            uploader <span class="semibold">{{itemFormatted.uploader}}</span>
          </span>
        </div>
      </div>
      <div class="duration-diff">
        <span class="bold" :style="{color: durationColor}">
          {{Math.abs(Math.round(itemFormatted.durationDiff))}}''
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
    durationColor: String
  },
  components: {
    Card
  },
  computed: {
    itemFormatted () {
      const itm = this.item
      console.log(itm)
      const snippet = itm.snippet
      return (itm && {
        ...itm,
        name: itm.nameFormatted,
        uploader: snippet.channelTitle,
        issue: ((itm.wordScore === 0 || !itm.nameTokensMap[0]) ? 'Name' : 'Duration') + ' Doesn\'t match',
        backgroundImage: snippet && snippet.thumbnails && snippet.thumbnails.high.url
      }) || {}
    }
  },
  methods: {
    // getCallback () {
    //   const status = this.item.status && this.item.status.slug
    //   switch (status) {
    //     case 'review-conversion':
    //       return this.openReviewModal
    //     default:
    //       return null
    //   }
    // },
    handleClick () {
      // if (this.clickCB === undefined) this.clickCB = this.getCallback()
      // if (typeof this.clickCB === 'function') this.clickCB()
    }
  },
  data () {
    return {
      cardOptions: {
        height: '2.5em',
        xRotationFactor: 0.01,
        hovScaleFactor: false,
        paddingY: '.5em',
        paddingX: 'var(--card-padding-x)'
      },
      rowClasses: 'col-sm-12',
      trackController: this.$controllers.track
    }
  }
}
</script>


<style lang="scss" scoped>
  .duration-diff {
    > span {
      font-size: 3em;
    }
  }
</style>