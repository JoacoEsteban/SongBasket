<template>
  <div class="empty-container">
    <div class="header">It's quiet . . .</div>
    <div class="info">We couldn't find any Playlists associated with this User.</div>
    <router-link to="/setup/guest" tag="button" class="button">Go Back</router-link>
  </div>
</template>

<script lang="ts">
export default {
  mounted () {
    if (this.$store.state.CurrentUser.playlists.length) { this.$router.push('/home') }
  }
}
</script>

<style lang="scss" scoped>
.empty-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.header {
  font-size: 2em;
  padding: 0.67em 0;
  font-weight: bold;
}

.info {
  font-size: 0.67em;
  margin-bottom: 2em;
}
</style>
