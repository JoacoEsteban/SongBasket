<template>

    <div class="display-whole-container">
      <div class="">
        <button class="button" @click="login">Login to Spotify</button>
        <div>or</div>
        <router-link to="/guest" tag="button" class="button">Continue without Logging in</router-link>
      </div>
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
@import url("../CSS/global.scss");


.login-sb-welcome{
  font-size: 1rem;
  font-family: 'Poppins thin'
}
.login-sb-title {
  font-size: 4.2rem;
  font-weight: bold;
  font-family: "poppins regular";
  margin-bottom: 1.5rem;
  line-height: 1
}
</style>
