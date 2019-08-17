<template>
<div class="display-whole-container">
  <div class="home-folder-container">
      <div class="login-sb-welcome">welcome to</div>
      <div class="login-sb-title">SongBasket</div>
      <button class="button" @click="$emit('init')">Set a Home Folder</button>
  </div>
</div>
</template>

<script>
export default {
}
</script>

<style scoped lang="scss">
  .home-folder-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>