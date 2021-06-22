<template>
  <div v-show="!(!transitioning && !showLocal)" class="modal-wrapper">
    <div :class="{'show': showLocal}" class="modal-container">
      <div class="content box-shadow">
        <modal-loader @close="close" />
      </div>
    </div>
    <div @click="close" :class="{'show': showLocal}" class="dark-body" />
  </div>
</template>

<script>
import ModalLoader from './ModalLoader'
export default {
  data () {
    return {
      showLocal: false,
      transitioning: false,
      // TODO adapt to global transition scale factor
      transitionTime: 300
    }
  },
  components: {
    ModalLoader
  },
  methods: {
    close () {
      if (this.transitioning) return
      this.$root.$(window).off('keyup', this.onKeyUp)
      this.$store._actions.closeModal[0]()
    },
    onKeyUp ({key}) {
      return key === 'Escape' ? this.close() : null
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
        if (val) this.$root.$(window).on('keyup', this.onKeyUp)
        this.showLocal = val
        setTimeout(() => {
          this.transitioning = false
        }, this.transitionTime)
      }, 0)
    }
  }
}
</script>

<style lang="scss">
$tst: var(--ts-g);
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  .modal-container {
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
  .content {
    background-color: var(--global-grey-secondary);
    pointer-events: all;
    border-radius: .2em;
  }
  .modal-body {
    font-size: .7em;
  }
  .modal-controls {
    margin-top: 1em;
    .button {
      margin: 0 .3em;
      min-width: 11em;
    }
}
}

</style>