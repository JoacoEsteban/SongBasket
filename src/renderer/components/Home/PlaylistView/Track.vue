<template>
  <div class="pl-track-container">
    <div class="pl-track-info-container">
      <div class="pl-track-img-container">
        <div class="pl-track-img" :style="'background-image: url('+track.album.images[0].url+')'" />
      </div>
      <div class="pl-track-data">
        <div class="pl-track-data-up">
          <div class="pl-track-data-name">{{track.name}}</div>
          <div class="pl-track-data-albumname">{{track.album.name}}</div>
          <div class="pl-track-data-byartist">by {{artists}}</div>
        </div>

        <div class="pl-track-data-down">
          <div class="pl-track-data-duration">Duration: <span>{{durationFormatted}}</span></div>
        </div>
      </div>
    </div>
    <!-- <div class="pl-track-controls-container">
      <button class="button" @click="$emit('openYtVideo')">Open</button>
    </div> -->
  </div>
</template>

<script>
import * as utils from '../../../utils'

export default {
  props: {
    track: {
      type: Object,
      required: true
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
      let { minutes, seconds } = utils.convertMS(this.track.duration_ms)
      return { minutes, seconds }
    },
    durationFormatted () {
      let min =
        this.songDuration.minutes < 10
          ? '0' + this.songDuration.minutes
          : this.songDuration.minutes.toString()
      let sec =
        this.songDuration.seconds < 10
          ? '0' + this.songDuration.seconds
          : this.songDuration.seconds.toString()

      return min + ':' + sec
    }
  },
  mounted () {}
}
</script>

<style lang="scss">
/* TODO Media Query for List View */
.pl-track-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 2.8em;
  margin: 0.4em 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
}
.pl-track-info-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}
.pl-track-img-container {
  height: 2.8em;
  width: 2.8em;
  box-sizing: border-box;
  border: 0.1em solid white;
}
.pl-track-img {
  width: 100%;
  height: 100%;
  background-size: cover;
}
.pl-track-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: .2em 0;
  padding-left: 0.2em;
  height: 100%;
  font-size: .85em;
  background: #252525;
  padding-right: .3em;
  border-radius: 0 .2em .2em 0;
}
.pl-track-data-up {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
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
  font-family: "Poppins semibold";
  font-size: 0.6em;
}
.pl-track-data-duration {
  font-family: "Poppins regular";
  line-height: 1;
  font-size: 0.3em;
  span{
    font-family: 'Poppins Bold';
  }
}
.pl-track-controls-container{
  padding-right: .2em;
}
</style>
