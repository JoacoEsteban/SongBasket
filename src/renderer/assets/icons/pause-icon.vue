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
      path: 'M14,19H18V5H14M6,19H10V5H6V19Z',
      iconColor: 'var(--icon-color)',
      className: 'icon close-icon'
    }
  }
}
</script>

<style>

</style>
