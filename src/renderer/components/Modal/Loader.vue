<template>
    <div>
        <unsync @close="$emit('close')" v-if="options.wich === 'unsync'" />
        <custom-track-url @close="$emit('close')" v-if="options.wich === 'custom-track-url'" />
        <reset-all-playlist-tracks @close="$emit('close')" v-if="options.wich === 'reset-all-playlist-tracks'" />
        <track-review @close="$emit('close')" v-if="options.wich === 'track-review'" :options="options.payload" />
    </div>
</template>

<script>
import Unsync from './Unsync'
import CustomTrackUrl from './CustomTrackUrl'
import ResetAllPlaylistTracks from './ResetAllPlaylistTracks'
import TrackReview from './TrackReview'
export default {
  components: {
    Unsync,
    CustomTrackUrl,
    ResetAllPlaylistTracks,
    TrackReview
  },
  computed: {
    options () {
      return this.$store.state.SharedStates.modal.options
    }
  }

}
</script>