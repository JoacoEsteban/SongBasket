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
      <div 
      @dblclick="toggleConversion"
      class="dbclick-hitbox" />
      <div class="pl-track-controls-container">
        <button class="button slim" @click="">
            <span>
              Override
            </span>
          </button>
        <button v-if="conversion" class="button slim" @click="toggleConversion">
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
      <div class="conversion-container df fldc aliic jucc">
        <div class="df juce alic flww h100">
          <div
          class="df fldc aliic boundaries"
          v-for="(track, index) in conversion.conversion.yt"
          :key="index">
            <div
            :class="{'selected': isSelected(track.id)}"
            class="pl-track-container">
            <div class="df aliic">

              <div class="pl-track-img-container">
                <div class="pl-track-img" :style="'background-image: url('+track.snippet.thumbnails.high.url+')'" />
              </div>
              <div class="controls">
                <div
                :class="{'disabled': isSelected(track.id)}"
                @click="select(track.id)" class="button slim">
                  <span>
                    {{isSelected(track.id) ? 'Selected' : 'Select'}}
                  </span>
                </div>
                <div @click="$emit('openYtVideo', track.id)" class="button slim">
                  <span>
                    Open
                  </span>
                </div>
            </div>
            </div>
              <!-- <div class="aligner" /> -->
            </div>
            <div class="pl-track-data-up">
              <!-- TODO pull out ellipsis without fucking up the entire page -->
              <div class="pl-track-data-name ellipsis center">
                {{track.snippet.title | decodeUri}}
              </div>
              <div class="pl-track-data-byartist ">
                uploader <span class="bold">{{track.snippet.channelTitle | decodeUri}}</span>
              </div>
              <div class="pl-track-data-duration">Duration: <span>{{convertNFormat(track.duration)}}</span></div>

            </div>
          </div>
        </div>
        <div style="font-size: .5em;" class="df jucc mt-2">
          <div @click="select(null)" class="link-button">
            Reset Selection
          </div>
          <div @click="selectCustomUrl" class="link-button">
            Use Custom URL
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as utils from '../../../utils'
const he = require('he')

export default {
  data () {
    return {
      transitioning: false,
      convertionIsOpenedLocal: false,
      transitionCount: 0
    }
  },
  filters: {
    decodeUri: (text) => he.decode(text)
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
    playlist () {
      return this.$store.state.CurrentUser.currentPlaylist
    },
    songDuration () {
      return this.timeFilter(this.track.duration_ms)
    },
    durationFormatted () {
      let {minutes, seconds} = this.songDuration
      return this.formatDuration({minutes, seconds})
    },
    selected () {
      if (!this.conversion) return null
      return this.conversion.playlists.find(p => p.id === this.playlist).selected
    },
    customTrack () {
      if (!this.conversion) return null
      return this.conversion.playlists.find(p => p.id === this.playlist).custom
    }
  },
  mounted () {
    window.trackDebug = this
    this.convertionIsOpenedLocal = this.convertionIsOpened
  },
  methods: {
    toggleConversion () {
      if (!this.conversion) return
      this.$emit('toggleConversion', !this.convertionIsOpened)
    },
    selectCustomUrl () {
      this.$emit('customTrackUrl')
    },
    isSelected (id) {
      return id === (this.selected !== null ? this.selected : this.conversion.conversion.bestMatch)
    },
    select (id) {
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
  position: relative;
  align-items: center;
  width: 100%;
  min-width: 0;
  z-index: 0;
  
}
.dbclick-hitbox {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1;
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
  min-width: 0;
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
  width: calc(100%);
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
  position: relative;
  z-index: 2;
  // min-width: 15em;
  > .button {
    font-size: .65em;
    margin: 0 .3em;
    min-width: 13em;
  }
}
$conversion-height: 20em;
$conversion-time: .3s;
$transition-props: $conversion-time cubic-bezier(.12,.82,0,.99);
.animation-container {
  z-index: 0;
  height: 0;
  transition: height $transition-props;
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
  .boundaries {
    max-width: 13em;
    min-width: 11em;
  }
  padding: 1em;
  font-size: .9em;
  background-color: #252525;
  border-radius: 0 0 1em 1em;
  position: absolute;
  left: .3em;
  right: .3em;
  top: -3em;
  height: $conversion-height;
  transition: transform $transition-props, opacity $transition-props, top $transition-props;
  transform-origin: top;
  opacity: 0;
  transform: scale(.9);
  .aligner {
    min-width: 6em
  }

  .pl-track-data-up {
    font-size: .85em;
    align-items: center;
    padding: .3em 0;
  }

  .pl-track-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: transform .3s ease, border-color .3s ease;
    transform: scale(.95);
    $track-height: 4em;
    border-radius: .4em;
    height: $track-height;
    border: 3px solid transparent;
    width: 100%;

    &:nth-last-child(1) {
      margin-bottom: 0;
    }
    &.selected {
      transform: scale(1);
      border-color: var(--green-accept)
    }


    .pl-track-img-container {
      position: relative;
      $size: $track-height * .9;
      overflow: hidden;
      max-height: $size;
      min-height: $size;
      max-width: $size;
      min-width: $size;
      border-radius: 50%;
    }
    .pl-track-data-duration {
      font-size: .5em;
    }
    .controls {
      left: 4.5em;
      $padding: .5em;
      margin-left: .5em;
      top: $padding;
      bottom: $padding;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
    }
  }
}

.slim {
  > span {
    font-size: .8em;
  }
}
</style>
