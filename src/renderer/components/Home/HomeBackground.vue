<template>
  <!-- <div class="background-container" :style="{top: offsetTop + 'px'}"> -->
  <div class="background-container">
    <canvas id="background-canvas"></canvas>
  </div>  
</template>

<script>
export default {
  data () {
    return {
      offsetTop: 0,
      canvasContext: null
    }
  },
  mounted () {
    window.addEventListener('mousewheel', this.handleScroll)
    // window.addEventListener('resize', this.handleResize)
    this.initializeCanvas()
    // setInterval(() => {
    //   console.log(this.offsetTop)
    // }, 1000)
  },
  methods: {
    handleScroll (e) {
      this.offsetTop += Math.round(e.deltaY * -0.25)
    },
    handleResize (e) {
      let el = document.querySelector('#background-canvas')
      el.width = window.innerWidth * this.pixelRatio
      el.height = window.innerHeight * this.pixelRatio
      el.style.width = window.innerWidth + 'px'
      el.style.height = window.innerHeight + 'px'
    },
    initializeCanvas () {
      let ratio = (function () {
        let ctx = document.createElement('canvas').getContext('2d')
        let dpr = window.devicePixelRatio || 1
        let bsr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1

        return dpr / bsr
      })()

      let el = document.querySelector('#background-canvas')
      let w = window.innerWidth
      let h = window.innerHeight
      el.width = w * ratio
      el.height = h * ratio
      el.style.width = w + 'px'
      el.style.height = h + 'px'
      let ctx = el.getContext('2d')
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      this.canvasContext = ctx
      this.pixelRatio = ratio

      this.drawCanvas()
    },
    drawCanvas () {
      const offsetTop = () => this.offsetTop
      var ctx = this.canvasContext || document.querySelector('#background-canvas').getContext('2d')
      // let circle = {

      // }
      function randomColor () {
        return 'hsl(' + Math.round(Math.random() * 360) + ', 100%, 50%)'
      }
      function createCircle () {
        let circle = {}
        circle.radius = 75 * Math.random()
        circle.diameter = circle.radius * 2
        circle.x = window.innerWidth * Math.random()
        circle.y = window.innerHeight * Math.random()
        circle.dirX = 5 * Math.random() * (Math.random() > 0.5 ? 1 : -1)
        circle.dirY = 5 * Math.random() * (Math.random() > 0.5 ? 1 : -1)
        circle.fill = randomColor()

        return circle
      }
      let circles = []
      for (let i = 0; i < 50; i++) {
        circles.push(createCircle())
      }
      function drawCircle (circle) {
        ctx.fillStyle = circle.fill
        ctx.beginPath()
        ctx.arc(circle.x, circle.y + offsetTop(), circle.radius, 0, 2 * Math.PI)
        ctx.fill()
      }
      function drawCircles () {
        circles.forEach(circle => drawCircle(circle))
      }
      function updateCircle (circle) {
        circle.x += circle.dirX
        circle.y += circle.dirY
        if (circle.dirX > 0) {
          if (circle.x - circle.radius > window.innerWidth) {
            circle.x = circle.radius * -1
          }
        } else {
          if (circle.x + circle.radius < 0) {
            circle.x = window.innerWidth + circle.radius
          }
        }
        let oTop = offsetTop()
        if (circle.dirY > 0) {
          if (circle.y - circle.radius > window.innerHeight - oTop) {
            circle.y = circle.radius * -1 - oTop
          }
        } else {
          if (circle.y + circle.radius < 0 - oTop) {
            circle.y = window.innerHeight + circle.radius - oTop
          }
        }
      }
      function updateCircles () {
        circles.forEach(circle => updateCircle(circle))
      }
      function clearCanvas () {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
      function loop () {
        clearCanvas()
        drawCircles()
        updateCircles()
        requestAnimationFrame(loop)
      }
      loop()
    }
  }
}
</script>

<style lang="scss" scoped>
  .background-container {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    transition: transform var(--home-transition), filter var(--home-transition);
    &.transitioning {
      transform: scale(.85);
      filter: blur(20px);
    }
    #background-canvas {
      // height: 100%;
      // width: 100%;
    }
  }
</style>