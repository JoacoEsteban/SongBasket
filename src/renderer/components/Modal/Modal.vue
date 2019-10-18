<template>
    <div
    :class="{'d-none': !transitioning && !showLocal}"
    class="modal-container">
        <div
        :class="{'show': showLocal}"
        class="actual-modal">
            <div class="content box-shadow">
                <loader @close="close" />
            </div>
        </div>
        <div
        @click="close"
        :class="{'show': showLocal}"
        class="dark-body" />
    </div>
</template>

<script>
import Loader from './Loader'
export default {
  data () {
    return {
      showLocal: false,
      transitioning: false,
      transitionTime: 300
    }
  },
  components: {
    Loader
  },
  methods: {
    close () {
      if (this.transitioning) return
      this.$store.dispatch('closeModal')
    }
  },
  computed: {
    modal () {
      return this.$store.state.SharedStates.modal
    },
    show () {
      return this.modal.show
    }
  },
  watch: {
    show (val) {
      this.transitioning = true
      setTimeout(() => {
        this.showLocal = val
        setTimeout(() => {
          this.transitioning = false
        }, this.transitionTime)
      }, 0)
    }
  }

}
</script>

<style lang="scss" scoped>
$tst: .3s cubic-bezier(0.54, 0.67, 0, 1);
.modal-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
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
    transition: transform $tst, opacity $tst;
    transform-origin: bottom;
    opacity: 0;
    transform: scale(.7);

    &.show {
        opacity: 1;
        transform: scale(1);
    }
}
.content {
    background-color: var(--global-grey);
    pointer-events: all;
    border-radius: .3em;
}
.dark-body {
    position: relative;
    height: 100%;
    width: 100%;
    transition: opacity $tst;
    background-color: #000;
    z-index: 0;
    cursor: pointer;
    z-index: 0;
    opacity: 0;

    &.show {
        opacity: .8;
    }

}
</style>