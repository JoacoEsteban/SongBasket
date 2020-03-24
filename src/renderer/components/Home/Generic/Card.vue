<template>
<div class="card-container" :class="classObject" :style="styleObject">
  <div class="transformation-parent rel-full" @mousemove="onMouseMove" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @mousedown="setMouseListener" @click="handleClick">
    <div class="content" ref="content-container">
      <div class="card-background abs-full">
        <div class="rel-full ovfh">
          <div class="pl-img" :style="{backgroundImage: `url(${bgImage})`}">
          </div>
          <div class="gradient">
          </div>
          <div class="light-shine" ref="light-shine"></div>
        </div>
      </div>
      <div class="card-default-slot" :style="{height: this.options.height || '4em'}">
        <slot>
        </slot>
      </div>
    </div>
  </div>
</div>
</template>

<script>

let index = 0
export default {
  props: {
    item: Object,
    rowClasses: {
      type: String,
      default: 'col-lg-4 col-md-6 col-xs-12'
    },
    options: {
      type: Object,
      default: function () {
        return {}
      }
    },
    pressed: Boolean
  },
  data () {
    return {
      bounds: {
        bounds: null,
        timeStamp: -1
      },
      tOptions: {
        x: this.$props.options.xRotationFactor !== undefined ? this.$props.options.xRotationFactor : 0.05,
        y: this.$props.options.yRotationFactor !== undefined ? this.$props.options.yRotationFactor : 0.1,
        scaleFactor: (() => {
          let num = this.$props.options.hovScaleFactor !== undefined ? this.$props.options.hovScaleFactor : 1.05
          return `scale3d(${num}, ${num}, 1)`
        })()
      }
    }
  },
  computed: {
    bgImage () {
      return this.item && this.item.backgroundImage
    },
    classObject () {
      const obj = {
        pressed: this.pressed
      }
      obj[this.rowClasses] = true
      return obj
    },
    styleObject () {
      const px = this.options.paddingX || ''
      const py = this.options.paddingY || ''

      return {
        'padding-top': py,
        'padding-bottom': py,
        'padding-left': px,
        'padding-right': px
      }
    }
  },
  mounted () {
    window.card = this
    window.cardItem = this.item
  },
  methods: {
    handleClick () {
      this.$emit('click')
    },
    onMouseEnter (e) {
      this.hovering = true
      this.animateHover()
    },
    animateHover () {
      if (this.hoverTransitionsTimeout) { clearTimeout(this.hoverTransitionsTimeout); this.hoverTransitionsTimeout = null }
      this.applyHoverTransitions()
      this.hoverTransitionsTimeout = setTimeout(this.clearHoverTransitions, 1000)
    },
    applyHoverTransitions () {
      this.getRotationElement().css('transition', 'transform var(--local-hover-transition)')
      this.getLightShineElement().css('transition', 'all var(--local-hover-transition-fast)')
    },
    clearHoverTransitions () {
      this.getRotationElement().css('transition', '')
      this.getLightShineElement().css('transition', '')
      this.hoverTransitionsTimeout = null
    },
    onMouseMove (e) {
      this.hovering = true
      this.transformContainer(e)
    },
    onMouseLeave () {
      this.hovering = false
      this.restoreTransformation()
      this.animateHover()
    },
    setMouseListener () {
      this.$(window).on('mouseup', this.restoreTransformation)
    },
    promiseNextTick () {
      return new Promise((resolve, reject) => this.$nextTick(resolve))
    },
    getBounds () {
      return this.$root.plTransformInvalidation < this.bounds.timeStamp ? this.bounds.bounds : (this.bounds = {timeStamp: Date.now(),
        bounds: (() => {
          let bounds = this.getRotationElement()[0].getBoundingClientRect();
          ['x', 'y', 'width', 'height'].forEach(k => bounds[k] = bounds[k].toFixed(2))
          return bounds
        })()}).bounds
    },
    transformContainer (e) {
      if (this.hoverTransitionsTimeout && Date.now() - index < 50) return
      index = Date.now()
      if (window.MOUSE_BEING_CLICKED) return
      const vals = this.getContainerTransformation(e)
      this.getRotationElement().css('transform', vals[0])
      this.getLightShineElement().css(vals[1])
    },
    getContainerTransformation ({clientX, clientY}) {
      const bounds = this.getBounds()
      const {x, y, width, height} = bounds

      const valX = (clientX - x) / width
      const valY = (clientY - y) / height

      let tX = ((valX - 0.5) * 90 * this.tOptions.x).toFixed(4)
      let tY = ((valY - 0.5) * 90 * this.tOptions.y).toFixed(4)

      if (tX < -2.4) tX = -2.4
      if (tX > 2.4) tX = 2.4

      if (tY < -4) tY = -4
      if (tY > 4) tY = 4
      return [`perspective(1000px) rotateX(${tY}deg) rotateY(${tX}deg) ${this.pressed ? '' : this.tOptions.scaleFactor}`,
        {transform: `rotate(${-tY / 2}deg) translateX(${valX * 5}%)`}]
    },
    restoreTransformation (force) {
      if (!force && (window.MOUSE_BEING_CLICKED || this.hovering)) return
      this.$(window).off('mouseup', this.restoreTransformation)
      this.getRotationElement().css('transform', `perspective(1000px) rotateX(0deg) rotateY(0deg)`)
      this.getLightShineElement().css({'background-position': '', transform: ''})
    },
    getRotationElement () {
      return this.rotationElement || (this.rotationElement = this.$(this.$refs['content-container']))
    },
    getLightShineElement () {
      return this.lightShineElement || (this.lightShineElement = this.$(this.$refs['light-shine']))
    }
  }
}
</script>

<style lang="scss" scoped>
$q-false-color: #1b1b1b;
$q-true-color: rgb(103, 214, 0);
$bezier-tranka: cubic-bezier(0.12, 0.82, 0, 1);

// $playlist-height: 4em;
$title-size: .8em;
$transition-soft:  var(--local-hover-transition);
$transition-hard: .5s var(--bezier);
$hovering-transition: .3s $bezier-tranka;

.card-container {
  // --local-hover-transition: 0.5s cubic-bezier(0.12, 0.82, 0, 1);
  --local-hover-transition: 1s #{$bezier-tranka};
  --local-hover-transition-fast: .5s #{$bezier-tranka};
  box-sizing: border-box;
  padding: 1.5em var(--container-padding-x);
  padding-top: 0;
  z-index: 0;
  &:not(.pressed).transformation-parent {
    &:hover {
      transform: scale(1.03);
      .card-background {
        .light-shine {
          transition: opacity $transition-soft;
          opacity: 1;
        }
      }
    }
  }
  .transformation-parent {
    &:hover {
      transform: scale(1.03);
      .card-background {
        .light-shine {
          // transition: opacity $transition-soft;
          opacity: 1;
        }
      }
    }
    transition: transform $transition-soft, opacity $transition-soft;
    perspective: 1000px;
    perspective-origin: 50% 100px;
    &:active {
      transition: transform $transition-hard, opacity $transition-hard;
      transition-delay: .0575s;
      transform: scale(.98);
      opacity: .7;
    }

    > .content {
      cursor: pointer;
      position: relative;
      background: $q-false-color;
      $transition: var(--local-hover-transition);
      transition: background-color $transition,
      box-shadow $transition;
      // transform $transition;
      transform-style: preserve-3d;
      will-change: transform;
      color: #f0f0f0;
      // box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4);
    }
  }

  .card-background {
    .rel-full {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .gradient {
      position: absolute;
      $offset: -3px;
      top: $offset;
      bottom: $offset;
      right: $offset;
      left: $offset;
      background: linear-gradient(to right, $q-false-color 50%, transparent 200%);
    }
    .light-shine {
      position: absolute;
      pointer-events: none;
      z-index: 1;
      $offset: -30;
      top: $offset*1px;
      bottom: $offset*1px;
      right: $offset/2*1em;
      left: $offset/2*1em;
      transition: opacity $hovering-transition;
      // transition: opacity $transition-soft;
      opacity: .5;
      background: linear-gradient(31deg, transparent 50%, rgba(255,255,255,.045) 50%, transparent 100%);
      // background: linear-gradient(31deg, transparent -100%,  rgba(0,0,0,.5) 50%, rgba(255,255,255,.045) 50%, transparent 100%);
      background-position: center;
    }
    .pl-img {
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      height: 100%;
      width: 50%;
    }
  }

  .card-default-slot {
    text-align-last: left;
    position: relative;
    display: flex;
    padding: 0.6em .5em;
  }

  // -----------------STATES-----------------

  &.pressed {
    .transformation-parent {
      transform: scale(.9);
      opacity: .7;
      &:active {
        transform: scale(.85);
        opacity: .5;
      }
    }
  }

}

</style>