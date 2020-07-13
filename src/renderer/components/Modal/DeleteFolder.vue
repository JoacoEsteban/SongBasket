<template>
    <div class="modal-content">
        <div class="header">
            Are you sure you want to remove all data asociated with
            <b>
              {{payload.path}}
            </b>?
        </div>
        <div class="modal-body light">
          Delete all data or just remove from the list
        </div>
        <div class="modal-controls df global-center">
          <button @click="removeFromList" class="button">Remove from list</button>
          <button @click="deleteAll" class="button cancel">Delete all data</button>
        </div>
    </div>
</template>

<script>
export default {
  computed: {
    payload () {
      return this.$store.state.SharedStates.modal.options.payload
    }
  },
  methods: {
    async removeFromList () {
    },
    async deleteAll () {
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
</style>