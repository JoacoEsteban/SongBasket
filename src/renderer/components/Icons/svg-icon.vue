<template>
    <svg :style="'width: 1em; height: 1em; fill: ' + colorLocal">
        <path :d="path" />
    </svg>
</template>

<script>
export default {
  props: {
    path: {
      required: true,
      type: String
    },
    color: {
      required: false,
      type: String,
      default: '#f0f'
    }
  },
  data () {
    return {
      colorLocal: ''
    }
  },
  mounted () {
    if (this.color[0] !== '#') this.colorLocal = '#' + this.color
    else this.colorLocal = this.color
  }
}
</script>

<style lang="scss" scoped>

</style>