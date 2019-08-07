<template>
  <div class="login-flex">
    <div class="login-container">
      <div class="login-sb-welcome">welcome to</div>
      <div class="login-sb-title">SongBasket</div>
      <button class="button" @click="login">Login to Spotify</button>
      <div>or</div>
      <router-link to="/guest" tag="button" class="button">Continue without Logging in</router-link>
    </div>
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
.login-flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;

}
.login-container {
  text-align: center;
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
