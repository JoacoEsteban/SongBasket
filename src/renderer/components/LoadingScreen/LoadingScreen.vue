<template>
  <div class="loading-container">
    <div>
      Loading
    </div>
    <div class="regular point5-em mt-2">
      Version {{version}}
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      version: global.CONSTANTS.APP_VERSION_STRING
    }
  }
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