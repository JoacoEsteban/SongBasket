<template>
  <svg-icon :path="path" :icon-color="iconColor" :class-name="className" />
</template>

<script lang="ts">
import SvgIcon from './SvgIcon.vue'

export default {
  components: {
    SvgIcon
  },
  data () {
    return {
      path: 'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
      iconColor: 'var(--icon-color)',
      className: 'icon warning-icon'
    }
  }
}
</script>

<style></style>
