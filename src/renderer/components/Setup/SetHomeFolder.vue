<template>
<div class="home-folder-container">
    <div class="login-sb-welcome">welcome to</div>
    <div class="login-sb-title">SongBasket</div>
    <button class="button" @click="$emit('handleClick')">Set a Home Folder</button>
</div>
</template>

<script>
export default {
}
</script>

<style scoped lang="scss">
.home-folder-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.login-sb-welcome{
  font-size: 1rem;
  // font-family: 'Poppins thin'
}
.login-sb-title {
  font-size: 4.2em;
  font-weight: 500;
  margin-bottom: 1.5rem;
  line-height: 1
}

</style>