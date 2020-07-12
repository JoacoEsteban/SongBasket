<template>
  <div class="folder-container">
    <div class="content" @click="atClick">
      <div class="left">
        <div class="round-img" :style="{'background-image': 'url(https://picsum.photos/500)'}"></div>
      </div>
      <div class="right"></div>
      <div class="bottom w100 df global-center">
        <div class="folder-path">{{path}}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    path: String
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
  &:not(:last-child) {
    margin-bottom: 1em;
  }
  .content {
    background-color: var(--global-grey);
  }
}
</style>