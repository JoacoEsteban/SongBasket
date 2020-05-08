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
      path: 'M8,5.14V19.14L19,12.14L8,5.14Z',
      iconColor: 'var(--icon-color)',
      className: 'icon close-icon'
    }
  }
}
</script>

<style>

</style>
