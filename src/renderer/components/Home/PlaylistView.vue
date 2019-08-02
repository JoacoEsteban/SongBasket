<template>
  <div class="container">
    <router-link to="/home" tag="span">
      <settings-icon />
    </router-link>
    <h1>PLAYLIST {{id}}</h1>
  </div>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;
import "vuex";
import settingsIcon from '../../assets/icons/settings-icon.vue'


export default {
  data() {
    return {
      //TODO make it work
      id: this.$route.params.id
    };
  },
  components:{
    settingsIcon
  },
  computed: {}
};
</script>

<style>
</style>
