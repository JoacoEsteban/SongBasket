<template>
    <div class="container" v-if="playlist">
        <div class="header">
            Are you sure you want to unsync <span class="bold">
                {{playlist.name}}
                </span>?
        </div>
        <div class="info light">
            {{playlist.tracks.total}} tracks will be deleted from your Hard Drive
        </div>
        <div class="controls df jucc aliic">
          <div @click="accept" class="button accept">Yes</div>
          <div @click="$emit('close')" class="button cancel">No</div>
        </div>
    </div>
</template>

<script>
export default {
  computed: {
    payload () {
      return this.$store.state.SharedStates.modal.options.payload
    },
    id () {
      return this.payload.id
    },
    playlist () {
      return this.$store.getters.PlaylistById(this.id)
    }
  },
  methods: {
    async accept () {
      await this.$controllers.core.unsyncPlaylist(this.id)
      this.$emit('close')
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