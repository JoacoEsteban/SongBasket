<template>
  <div class="login-container">
    <h1 class="login-sb-title">SongBasket</h1>
    <button class="button" @click="login">Login to Spotify</button>
    <div>or</div>
    <router-link to="/guest" tag="button" class="button">Continue without Logging in</router-link>
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;

export default {
  methods: {
    login() {
      ipc.send("login");
    }
  }
  // //Auto login For dev speed purposes
  // mounted(){
  //     this.login();
  // }
};
</script>

<style>
@import url("../CSS/global.css");
.login-container {
  text-align: center;
}
.login-sb-title {
  font-family: "poppins light";
}
</style>
