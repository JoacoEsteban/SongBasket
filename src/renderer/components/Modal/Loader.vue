<template>
    <div>
        <unsync @close="$emit('close')" v-if="options.wich === 'unsync'" />
        <custom-track-url @close="$emit('close')" v-if="options.wich === 'custom-track-url'" />
    </div>
</template>

<script>
import Unsync from './Unsync'
import CustomTrackUrl from './CustomTrackUrl'
export default {
  components: {
    Unsync,
    CustomTrackUrl
  },
  computed: {
    options () {
      return this.$store.state.SharedStates.modal.options
    }
  }

}
</script>