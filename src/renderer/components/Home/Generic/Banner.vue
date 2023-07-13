<template>
  <div class="banner-container">
    <div class="banner-default-slot">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
export default {

}
</script>

<style lang="scss" scoped>
.banner-container {
  width: 100%;
  min-height: 4em;
  height: 100%;
}
</style>