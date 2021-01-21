<template>
    <div class="container">
        <div class="header" v-if="playlist">
            Are you sure you want to reset all track selections for playlist <span class="bold">
                {{playlist.name}}
                </span>?
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
    playlist () {
      return this.$store.getters.PlaylistById(this.payload.playlistId)
    }
  },
  mounted () {
  },
  methods: {
    accept () {
      this.$store.dispatch('resetSelection', this.playlist.id)
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