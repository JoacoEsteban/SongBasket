<template>
    <div>
        <unsync @close="$emit('close')" v-if="options.wich === 'unsync'" />
    </div>
</template>

<script>
import Unsync from './Unsync'
export default {
  components: {
    Unsync
  },
  computed: {
    options () {
      return this.$store.state.SharedStates.modal.options
    }
  }

}
</script>