<template>
<Card :item="item" @click="atClick">
  <div class="folder-container">
    <div class="content">
      <div class="left">
        <div class="round-img" :style="{'background-image': 'url(' + item.backgroundImage + ')'}"></div>
      </div>
      <div class="right"></div>
      <div class="bottom w100 df global-center">
        <div class="folder-path">{{path}}</div>
      </div>
    </div>
  </div>
</Card>
</template>

<script>
import Card from '../Home/Generic/Card'
export default {
  components: {
    Card
  },
  computed: {
    item () {
      return {
        backgroundImage: 'https://picsum.photos/50' + this.index
      }
    }
  },
  props: {
    path: String,
    index: Number
  },
  methods: {
    atClick () {
      this.$emit('clicked')
    }
  }
}
</script>

<style lang="scss" scoped>
.folder-container {
  box-sizing: border-box;
  // flex-shrink: 0;
  // flex-grow: 0;
  // min-width: 20em;
  padding: .5em;
  display: flex;
  &:not(:last-child) {
    // margin-bottom: 1em;
  }
}
.card-container {
  min-width: fit-content;
  --borr: .5em;
}
</style>