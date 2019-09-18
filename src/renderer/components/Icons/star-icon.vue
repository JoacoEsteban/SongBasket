<template>
    <svg class="iconito" :style="'fill: ' + colorLocal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M148.13,78.23,128.77,89.41,140,108.77a3.73,3.73,0,0,1-3.23,5.6H114.37v22.35a3.73,3.73,0,0,1-5.6,3.23L89.41,128.77,78.23,148.13a3.73,3.73,0,0,1-6.46,0L60.59,128.77,41.23,140a3.73,3.73,0,0,1-5.6-3.23V114.37H13.28a3.73,3.73,0,0,1-3.23-5.6L21.23,89.41,1.87,78.23a3.73,3.73,0,0,1,0-6.46L21.23,60.59,10.05,41.23a3.73,3.73,0,0,1,3.23-5.6H35.63V13.28a3.73,3.73,0,0,1,5.6-3.23L60.59,21.23,71.77,1.87a3.73,3.73,0,0,1,6.46,0L89.41,21.23l19.36-11.18a3.73,3.73,0,0,1,5.6,3.23V35.63h22.35a3.73,3.73,0,0,1,3.23,5.6L128.77,60.59l19.36,11.18A3.73,3.73,0,0,1,148.13,78.23Z"/></g></g></svg>
</template>

<script>
import SvgIcon from './svg-icon'
export default {
  components: {
    SvgIcon
  },
  props: {
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
    .iconito {
        width: 100%;
        height: 100%;
    }
</style>