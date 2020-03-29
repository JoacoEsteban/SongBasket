<template>
  <Card :item="itemFormatted" :row-classes="rowClasses + (isSelected ? ' border-green' : ' border-transparent')" :options="cardOptions" @click="handleClick">
    <div class="w100 point75-em df alic">
      <div class="ellipsis pr-2">
        <div class="issue color-red point75-em semibold" v-if="itemFormatted.issue" >{{itemFormatted.issue}}</div>
        <div class="ellipsis name">
          <span v-html="itemFormatted.name">
          </span>
        </div>
        <div class="ellipsis">
          <span class="regular point75-em">
            <span class="semibold">{{itemFormatted.uploader}}</span>
          </span>
        </div>
      </div>
      <div class="duration-diff">
        <span class="bold" :style="{color: durationColor}">
          {{itemFormatted.duration}}
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
    durationColor: String,
    isSelected: Boolean
  },
  components: {
    Card
  },
  computed: {
    itemFormatted () {
      const itm = this.item
      const snippet = itm.snippet
      const isCustom = itm.isCustomTrack
      return (itm && {
        ...itm,
        name: isCustom ? snippet.title : itm.nameFormatted,
        uploader: snippet.channelTitle,
        issue: !isCustom && itm.isDoubtlyConversion ? ((itm.wordScore === 0 || !itm.nameTokensMap[0]) ? 'Name' : 'Duration') + ' Doesn\'t match' : null,
        backgroundImage: snippet && snippet.thumbnails && snippet.thumbnails.high.url,
        duration: isCustom ? 'CUSTOM' : Math.abs(Math.round(itm.durationDiff)) + '\'\''
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
      this.$emit('setSelection')
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


<style lang="scss" >
span.matching-token {
  color: var(--green-accept);
  font-weight: 500;
}
</style>
<style lang="scss" scoped>
.duration-diff {
  > span {
    font-size: 3em;
  }
}
</style>