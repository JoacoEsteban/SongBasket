<template>
  <h1>PLAYLIST {{id}}</h1>
</template>

<script>
const electron = require("electron");
const ipc = electron.ipcRenderer;

import "vuex";

export default {
  data() {
    return {
        //TODO make it work
      id: this.$route.params.id
    };
  },
  computed: {}
};
</script>

<style>
</style>
