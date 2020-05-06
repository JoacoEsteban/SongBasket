<template>
  <div class="loading-container">
    Loading
  </div>
</template>

<script>
export default {
}
</script>

<style scoped lang="scss">
.loading-container {
  -webkit-app-region: drag;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  align-self: center;
  height: var(--max-container-height);
  font-weight: bold;
}
</style>