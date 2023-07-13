<template>
  <div class="df fldc global-center">
    <button class="button" id="onboarding-login-button" @click="$emit('login')">Login to Spotify</button>
    <!-- <div>or</div>
      <button tag="button" @click="$emit('guestLogin')" class="button">Continue without Logging in</button> -->
  </div>
</template>

<script lang="ts">
export default {
  methods: {
  }
  // //Auto login For dev speed purposes
  // mounted(){
  //     this.login();
  // }
}
</script>

<style lang="scss"></style>
