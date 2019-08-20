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
    <div class="pl-track-controls-container">
      <button class="button" @click="$emit('searchOnYoutube')">Convert</button>
    </div>
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
  height: 2.8rem;
  margin: 0.4rem 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
}
.pl-track-info-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
}
.pl-track-img-container {
  height: 2.8rem;
  width: 2.8rem;
  box-sizing: border-box;
  border: 0.1rem solid white;
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
  padding-left: 0.2rem;
  height: 100%;
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
  font-size: 0.9rem;
  line-height: 1.3;
}
.pl-track-data-albumname {
  font-family: "Poppins Bold";
  font-size: 0.6rem;
}
.pl-track-data-byartist {
  font-family: "Poppins Semibold";
  font-size: 0.4rem;
}
.pl-track-data-duration {
  font-family: "Poppins regular";
  line-height: 1;
  font-size: 0.3rem;
  span{
    font-family: 'Poppins Bold';
  }
}
.pl-track-controls-container{
  padding-right: .2rem;
}
</style>
