<template>
    <div class="container">
        <div class="header">
            Enter a YouTube Url
        </div>
        <div class="info light">
          <input v-model="url" type="text">            
        </div>
        <div class="controls df jucc aliic">
          <div @click="accept" class="button accept">Accept</div>
          <div @click="$emit('close')" class="button cancel">Cancel</div>
        </div>
    </div>
</template>

<script>
const electron = require('electron')
const ipc = electron.ipcRenderer

export default {
  data () {
    return {
      url: ''
    }
  },
  computed: {
    payload () {
      return this.$store.state.SharedStates.modal.options.payload
    }
  },
  methods: {
    accept () {
      return new Promise(resolve => {
        ipc.send('ytTrackDetails', this.url)
        ipc.on('done', (event, details) => {
          let {trackId, playlistId} = this.payload
          this.$store.dispatch('customTrackUrl', {details, trackId, playlistId})
          this.$emit('close')
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
    padding: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.info {
    font-size: .7em;
}
.controls {
  margin-top: 1em;
  .button {
    margin: 0 .3em;
    width: 5em;
  }
}
</style>