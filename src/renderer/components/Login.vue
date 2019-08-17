<template>
  <div class="login-flex">
    <div class="login-header">Let's Find your Music</div>
    <div class="login-container">
      <button class="button" @click="login">Login to Spotify</button>
      <div>or</div>
      <router-link to="/guest" tag="button" class="button">Continue without Logging in</router-link>
    </div>
  </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  methods: {
    login () {
      ipc.send('login')
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
.login-flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
}
.login-container {
  text-align: center;
}
.login-header {
  height: 10rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-family: 'Poppins Bold'

}
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
