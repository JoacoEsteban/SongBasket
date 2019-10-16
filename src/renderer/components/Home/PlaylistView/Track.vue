<template>
  <div class="whole-container">
    <div class="pl-track-container">
      <div class="pl-track-info-container">
        <div class="pl-track-img-container">
          <div class="pl-track-img" :style="'background-image: url('+track.album.images[0].url+')'" />
        </div>
        <div class="pl-track-data">
          <div class="pl-track-data-up">
            <div class="pl-track-data-name ellipsis left">{{track.name}}</div>
            <div class="pl-track-data-albumname ellipsis left">{{track.album.name}}</div>
            <div class="pl-track-data-byartist ellipsis left">by <span class="bold">{{artists}}</span></div>
          </div>

          <div class="pl-track-data-down">
            <div class="pl-track-data-duration">Duration: <span>{{durationFormatted}}</span></div>
          </div>
        </div>
      </div>
      <div class="pl-track-controls-container">
        <button class="button thin" @click="">
            <span>
              Override
            </span>
          </button>
        <button v-if="conversion" class="button thin" @click="$emit('toggleConversion', !convertionIsOpened)">
          <span>
            {{convertionIsOpenedLocal ? 'Collapse' : 'Show'}} Conversion
          </span>
        </button>
      </div>
    </div>

    <div
    v-if="conversion"
    :class="{'show': convertionIsOpenedLocal, 'transitioning': transitioning, 'd-none': !convertionIsOpened && !transitioning}"
    class="animation-container">
      <div class="conversion-container df fldc jucb alic">
        <div
        v-for="(track, index) in conversion.yt"
        :key="index"
        :class="{'selected': isSelected(track.id)}"
        class="pl-track-container yt bestMatch">
          <div class="pl-track-img-container">
            <div class="pl-track-img" :style="'background-image: url('+track.snippet.thumbnails.high.url+')'" />
          </div>
          <div class="aligner" />
          <div class="pl-track-data-up">
            <!-- TODO pull out ellipsis without fucking up the entire page -->
            <div class="pl-track-data-name  center">
              {{track.snippet.title}}
            </div>
            <div class="pl-track-data-byartist ">
              uploader <span class="bold">{{track.snippet.channelTitle}}</span>
            </div>
            <div class="pl-track-data-duration">Duration: <span>{{convertNFormat(track.duration)}}</span></div>

          </div>

          <div class="aligner" />
          <div class="controls">
            <div
            :class="{'disabled': isSelected(track.id)}"
            @click="select(track.id)" class="button thin">
              <span>
                {{isSelected(track.id) ? 'Selected' : 'Select'}}
              </span>
            </div>
            <div @click="$emit('openYtVideo', track.id)" class="button thin">
              <span>
                Open
              </span>
            </div>
          </div>
        </div>
        <div style="font-size: .5em;" class="df">
          <div @click="select(null)" class="link-button">
            Reset Selection
          </div>
          <div class="link-button">
            Use Custom URL
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as utils from '../../../utils'

export default {
  data () {
    return {
      transitioning: false,
      convertionIsOpenedLocal: false,
      transitionCount: 0
    }
  },
  props: {
    track: {
      type: Object,
      required: true
    },
    conversion: {
      type: Object,
      required: false,
      default: null
    },
    convertionIsOpened: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    convertionIsOpened (val) {
      this.transitionCount++
      this.transitioning = true
      setTimeout(() => {
        this.convertionIsOpenedLocal = val
      }, 50)
      setTimeout(() => {
        this.transitionCount--
        if (this.transitionCount === 0) this.transitioning = false
      }, 550)
    }
  },
  computed: {
    artists () {
      if (this.track.artists.length > 1) {
        let artists = ''
        for (let i = 0; i < this.track.artists.length; i++) {
          artists += this.track.artists[i].name + ', '
        }
        return artists.substring(0, artists.length - 2)
      } else {
        return this.track.artists[0].name
      }
    },

    songDuration () {
      return this.timeFilter(this.track.duration_ms)
    },
    durationFormatted () {
      let {minutes, seconds} = this.songDuration
      return this.formatDuration({minutes, seconds})
    }
  },
  mounted () {
    this.convertionIsOpenedLocal = this.convertionIsOpened
  },
  methods: {
    shorten (text) {
      let length = 50
      if (text.length < length - 3) return text
      return text.substring(0, length).trim() + '...'
    },
    isSelected (id) {
      return id === this.conversion.selected
    },
    select (id) {
      if (!id) id = this.conversion.bestMatch
      if (this.isSelected(id)) return
      this.$emit('selectTrack', id)
    },
    timeFilter (ms) {
      let { minutes, seconds } = utils.convertMS(ms)
      return { minutes, seconds }
    },
    formatDuration ({minutes, seconds}) {
      let min =
        minutes < 10
          ? '0' + minutes
          : minutes.toString()
      let sec =
        seconds < 10
          ? '0' + seconds
          : seconds.toString()

      return min + ':' + sec
    },
    convertNFormat (ms) {
      if (ms < 1000) ms = ms * 1000 // Assuming time is expressed in seconds instead of ms
      return this.formatDuration(this.timeFilter(ms))
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../CSS/helpers.scss';
/* TODO Media Query for List View */
.whole-container {
  margin: 0.4em 0;
  z-index: 0;

}
$track-height: 3.5em;
.pl-track-container {
  @extend .box-shadow;
  z-index: 1;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: $track-height;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;

  background: #353535;
  padding-right: .3em;
  border-radius: 0 .4em .4em 0;
}
.pl-track-info-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  
}
.pl-track-img-container {
  min-height: $track-height;
  max-height: $track-height;
  height: $track-height;
  min-width: $track-height;
  max-width: $track-height;
  width: $track-height;
  box-sizing: border-box;
  border: 0.1em solid white;
}
.pl-track-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
.pl-track-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: .2em 0;
  padding-left: 0.2em;
  width: 100%;
  height: 100%;
  font-size: .85em;
}
.pl-track-data-up {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  // height: 100%;
  width: 100%;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  width: calc(98%);
  text-overflow: ellipsis;

  &.left {
    text-align: left;
  }
  &.center {
    text-align: center;
  }
  &.right {
    text-align: right;
  }

}
.pl-track-data-name {
  font-family: "Poppins Bold";
  font-size: 0.75em;
  line-height: 1.3;
}
.pl-track-data-albumname {
  font-family: "Poppins regular";
  font-size: 0.65em;
  line-height: 1;
}
.pl-track-data-byartist {
  font-family: "Poppins regular";
  font-size: 0.6em;
}
.pl-track-data-duration {
  font-family: "Poppins regular";
  line-height: 1;
  font-size: 0.5em;
  span{
    font-family: 'Poppins Bold';
  }
}
.pl-track-controls-container{
  display: flex;
  align-items: center;
  justify-content: flex-end;
  // min-width: 15em;
  > .button {
    font-size: .65em;
    margin: 0 .3em;
    min-width: 13em;
  }
}
$conversion-height: 25em;
$conversion-time: .5s;
.animation-container {
  z-index: 0;
  height: 0;
  transition: height $conversion-time ease;
  position: relative;
  pointer-events: none;
  &.show {
    height: $conversion-height;
    z-index: 0;
    pointer-events: all;
    .conversion-container {
      top: 0;
      opacity: 1;
      transform: scale(1)
    }
  }
  &.transitioning {
    z-index: -1;
    pointer-events: none;
  }
}
.conversion-container {
  padding: 1em;
  font-size: .9em;
  background-color: #252525;
  border-radius: 0 0 1em 1em;
  position: absolute;
  left: .3em;
  right: .3em;
  top: -3em;
  height: $conversion-height;
  $transition-props: $conversion-time ease;
  transition: transform $transition-props, opacity $transition-props, top $transition-props;
  transform-origin: top;
  opacity: 0;
  transform: scale(.9);
  .aligner {
    min-width: 6em
  }

  .pl-track-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: .5em;
    transition: transform .3s ease, border-color .3s ease;
    transform: scale(.95);
    $track-height: 4em;
    height: $track-height;
    border: 3px solid transparent;
    border-left: none;


    &:nth-last-child(1) {
      margin-bottom: 0;
    }
    &.selected {
      transform: scale(1);
      border-color: var(--green-accept)
    }


    .pl-track-img-container {
      position: absolute;
      $size: $track-height * 1.1;
      height: $size;
      min-height: $size;
      width: $size;
      min-width: $size;
      left: 0;
    }
    .pl-track-data-duration {
      font-size: .5em;
    }
    .pl-track-data-up {
      font-size: 1.1em;
      align-items: center;
      padding: .3em 0;
    }
    .controls {
      position: absolute;
      right: 0;
      $padding: .25em;
      top: $padding;
      bottom: $padding;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-right: 1em;
    }
  }
}

.thin {
  > span {
    font-size: .8em;
  }
}
</style>
