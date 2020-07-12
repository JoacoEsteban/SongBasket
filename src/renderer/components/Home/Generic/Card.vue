<template>
<div class="card-container window-nodrag" :class="classObject" :style="styleObject">
  <div class="transformation-parent rel-full" @mousemove="onMouseMove" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @mousedown="setMouseListener" @click="handleClick">
    <div class="card-content" ref="content-container">
      <div class="card-background abs-full">
        <div class="rel-full ovfh">
          <div class="card-img" :style="{backgroundImage: `url(${bgImage})`}">
          </div>
          <div class="gradient">
          </div>
          <div class="light-shine" ref="light-shine"></div>
        </div>
      </div>
      <div class="card-default-slot" :style="{height: this.options.height || '4em', 'font-size': this.options.size || ''}">
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
      required: false
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
          if (this.$props.options.hovScaleFactor === false) return ''
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
      obj[this.rowClasses || 'col-lg-4 col-md-6 col-xs-12'] = true
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
      this.getRotationElement().css('transition', 'transform var(--card-hover-transition)')
      this.getLightShineElement().css('transition', 'all var(--card-hover-transition-fast)')
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
      return this.$root.cardTransformInvalidation < this.bounds.timeStamp ? this.bounds.bounds : (this.bounds = {timeStamp: Date.now(),
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

// $playlist-height: 4em;
$title-size: .8em;
$transition-soft: var(--card-hover-transition);
$transition-hard: var(--ts-g-hard);

.card-container {
  --borr: 0;
  box-sizing: border-box;
  padding: var(--container-padding-x) calc(var(--container-padding-x) / 2);
  padding-top: 0;
  z-index: 0;
  flex-shrink: 0;
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

    > .card-content {
      cursor: pointer;
      position: relative;
      background: $q-false-color;
      $transition: var(--card-hover-transition);
      transition: background-color $transition,
      box-shadow $transition;
      border-radius: var(--borr);
      overflow: hidden;
      // transform $transition;
      transform-style: preserve-3d;
      will-change: transform;
      color: #f0f0f0;
      // box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4);
    }
  }

  .card-background {
    --gradient-offset: 50%;
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
      background: linear-gradient(to right, $q-false-color var(--gradient-offset), transparent 200%);
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
      transition: opacity var(--card-hover-transition-fast);
      // transition: opacity $transition-soft;
      opacity: .5;
      background: linear-gradient(31deg, transparent 50%, rgba(255,255,255,.045) 50%, transparent 100%);
      // background: linear-gradient(31deg, transparent -100%,  rgba(0,0,0,.5) 50%, rgba(255,255,255,.045) 50%, transparent 100%);
      background-position: center;
    }
    .card-img {
      --card-img-width: 50%;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      height: 100%;
      width: var(--card-img-width);
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