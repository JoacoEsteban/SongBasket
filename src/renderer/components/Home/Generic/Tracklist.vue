<template>
  <div class="tracklist-container">
    <Track v-for="(track, index) in items" :key="index" :item="track" />
  </div>
</template>

<script lang="ts">
import Card from './Card.vue'
export default {
  components: {
    Track: Card
  },
  props: {
    items: {
      type: Array,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped></style>