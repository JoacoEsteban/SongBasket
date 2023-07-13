<template>
    <div>
        <unsync @close="$emit('close')" v-show="options.wich === 'unsync'" />
        <custom-track-url @close="$emit('close')" v-show="options.wich === 'custom-track-url'" />
        <reset-all-playlist-tracks @close="$emit('close')" v-show="options.wich === 'reset-all-playlist-tracks'" />
        <!-- <track-review @close="$emit('close')" v-show="options.wich === 'track-review'" :options="options.payload" /> -->
        <delete-folder @close="$emit('close')" v-show="options.wich === 'delete-folder'" />
    </div>
</template>

<script lang="ts">
import Unsync from './Unsync.vue'
import CustomTrackUrl from './CustomTrackUrl.vue'
import ResetAllPlaylistTracks from './ResetAllPlaylistTracks.vue'
import TrackReview from './TrackReviewOld.vue'
import DeleteFolder from './DeleteFolder.vue'
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