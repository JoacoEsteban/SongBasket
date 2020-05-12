<template>
    <div class="">
      <button class="button" @click="login">Login to Spotify</button>
      <div>or</div>
      <router-link to="/setup/guest" tag="button" class="button">Continue without Logging in</router-link>
    </div>
</template>

<script>
export default {
  methods: {
    login () {
      this.$emit('login')
    }
  }
  // //Auto login For dev speed purposes
  // mounted(){
  //     this.login();
  // }
}
</script>

<style lang="scss">
</style>
