<template>
  <svg height="100%" width="100%" :style="style" :class="customClasses" xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path :d="path" />
  </svg>
</template>

<script lang="ts">
export default {
  props: {
    path: {
      type: String,
      require: true
    },
    iconColor: {
      type: String,
      require: true
    },
    className: {
      type: String,
      require: true
    }
  },
  data () {
    return {
      customClasses: this.className,
      style: {
        background: 'none',
        fill: this.iconColor
      }

    }
  },
  computed: {
  }
}
</script>

<style></style>