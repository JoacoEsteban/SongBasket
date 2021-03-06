<template>
    <div class="container">
        <div class="header">
          <b>
            Enter a YouTube Url
          </b>
        </div>
        <div class="info light">
          <input @keyup.enter="accept" ref="input" v-model="url" class="std-input" type="text">
          <div :class="{'valid': valid === true, 'invalid': valid === false, 'hide': hide}" class="valid-container" />
        </div>
        <div :class="{'hide': hideControls}" class="controls df jucc aliic">
          <div @click="accept" class="button accept">Accept</div>
          <div @click="cancel" class="button cancel">Cancel</div>
        </div>
        <div :class="{'hide': !hideControls}" class="controls loading">
          {{loadingText}}
        </div>
    </div>
</template>

<script>
export default {
  data () {
    return {
      url: '',
      valid: null,
      hide: true,
      hideControls: false,
      loadingText: 'Loading',
      regex: {
        url: /(^(https:\/\/www.youtube.com.watch\?v=([a-zA-Z0-9-_]{11}))$)/,
        id: /^[a-zA-Z0-9-_]{11}$/
      }
    }
  },
  computed: {
    payload () {
      return this.$store.state.SharedStates.modal.options.payload
    },
    show () {
      return this.$store.state.SharedStates.modal.show
    }
  },
  watch: {
    url (val) {
      if (val === '') return (this.hide = true)
      this.valid = this.regex.url.test(val) || this.regex.id.test(val)
      this.hide = false
    },
    show (val) {
      if (val) return this.focusInput()
      this.url = ''
      this.valid = null
      this.hide = true
      this.hideControls = false
      this.loadingText = 'Loading'
    }
  },
  mounted () {
    this.focusInput()
  },
  methods: {
    focusInput () {
      this.$refs.input && this.$refs.input.focus()
    },
    cancel () {
      this.$emit('close')
      this.payload.cancelCb && this.payload.cancelCb()
    },
    accept () {
      if (!this.valid || this.url === '') return
      this.hide = true
      this.hideControls = true
      return new Promise(resolve => {
        const listenerId = this.$uuid()
        this.$IPC.once(listenerId, (event, details) => {
          this.$emit('close')
          this.payload.cb && this.payload.cb()
        })
        this.$IPC.once(listenerId + ':ERROR', () => {
          this.loadingText = 'Video not found'
          setTimeout(() => {
            this.hideControls = false
            this.loadingText = 'Loading'
          }, 200)
        })
        this.$IPC.send('YOUTUBE_DETAILS:GET', {url: this.url, trackId: this.payload.trackId, listenerId})
      })
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
  position: relative;
}
.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: .7em;
  margin: 1em 0;
}
$transition: .2s cubic-bezier(.12,.82,0,.99);
.valid-container {
  transition: width $transition, background-color $transition;
  width: 100%;
  height: .2em;
  &.hide {
    width: 0;
  }
  &.valid {
    background-color: var(--green-accept);
  }
  &.invalid {
    background-color: var(--red-cancel);
  }
}
.std-input {
  font-size: 2em;
  width: 65vw;
  border-bottom: 1px solid #666;
}
.controls {
  margin-top: 1em;
  transition: opacity $transition, transform $transition;
  transform-origin: bottom;
  transform: scale(1);
  opacity: 1;

  &.hide {
    transform: scale(.75);
    opacity: 0;
  }
  .button {
    margin: 0 .3em;
    width: 5em;
  }

  &.loading {
    position: absolute;
    bottom: 1em
  }
}
</style>