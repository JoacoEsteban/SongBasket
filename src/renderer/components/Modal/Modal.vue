<template>
    <div v-if="false" class="modal-container">
        <div class="actual-modal">
            <div class="content">
                Holi
            </div>
        </div>
        <div class="dark-body" />
    </div>
</template>

<script>
export default {
  computed: {
  }

}
</script>

<style lang="scss" scoped>
.modal-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
}
.dark-body {
    position: relative;
    height: 100%;
    width: 100%;
    background-color: #000;
    opacity: .8;
    z-index: 0;
    cursor: pointer;
    z-index: 0;
}
.actual-modal {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 1;
}
.content {
    background-color: #fff;
    pointer-events: all;
}
</style>