<template>
    <div>
        <unsync @close="$emit('close')" v-if="options.wich === 'unsync'" />
        <custom-track-url @close="$emit('close')" v-if="options.wich === 'custom-track-url'" />
        <reset-all-playlist-tracks @close="$emit('close')" v-if="options.wich === 'reset-all-playlist-tracks'" />
    </div>
</template>

<script>
import Unsync from './Unsync'
import CustomTrackUrl from './CustomTrackUrl'
import ResetAllPlaylistTracks from './ResetAllPlaylistTracks'
export default {
  components: {
    Unsync,
    CustomTrackUrl,
    ResetAllPlaylistTracks
  },
  computed: {
    options () {
      return this.$store.state.SharedStates.modal.options
    }
  }

}
</script>