<template>
    <svg-icon :path="path" :icon-color="iconColor" :class-name="className" />
</template>

<script>
import SvgIcon from './SvgIcon.vue'

export default {
  components: {
    SvgIcon
  },
  data () {
    return {
      path: 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
      iconColor: 'var(--icon-color)',
      className: 'icon home-icon'
    }
  }
}
</script>

<style>

</style>
