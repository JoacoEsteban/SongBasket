<template>
    <div>
        <unsync @close="$emit('close')" v-show="options.wich === 'unsync'" />
        <custom-track-url @close="$emit('close')" v-show="options.wich === 'custom-track-url'" />
        <reset-all-playlist-tracks @close="$emit('close')" v-show="options.wich === 'reset-all-playlist-tracks'" />
        <!-- <track-review @close="$emit('close')" v-show="options.wich === 'track-review'" :options="options.payload" /> -->
        <delete-folder @close="$emit('close')" v-show="options.wich === 'delete-folder'" />
    </div>
</template>

<script>
import Unsync from './Unsync'
import CustomTrackUrl from './CustomTrackUrl'
import ResetAllPlaylistTracks from './ResetAllPlaylistTracks'
import TrackReview from './TrackReviewOld'
import DeleteFolder from './DeleteFolder'
export default {
  components: {
    Unsync,
    CustomTrackUrl,
    ResetAllPlaylistTracks,
    TrackReview,
    DeleteFolder
  },
  computed: {
    options () {
      return this.$store.state.SharedStates.modal.options
    }
  }

}
</script>