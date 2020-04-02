<template>
  <div class="track-banner-container w100" :class="isDownload ? 'download ' + downloadStatus.state : ''">
    <banner>
      <div class="background-progress" :style="{'--progress': (downloadStatus.ptg || 0) + '%'}" :class="downloadStatus.state" v-if="isDownload">
        <div class="progress-label df alic">
          <span class="uppercase half-op point5-em semibold">
            {{downloadStatus.state + ' ' + downloadStatus.ptg}}%
          </span>
        </div>
      </div>
      <div class="track-data w100">
        <div class="track-image">
          <div v-if="isDownload" class="see-track-link">
            <span class="sb-link uppercase semibold">
              see track
            </span>
          </div>
          <Card row-classes="w100 h100 p-0imp track-banner-card" :item="cardItem" :options="cardOptions">
          </Card>
        </div>
        <div class="track-info df fldc jucb ellipsis h100">
          <div class="ellipsis lh1point5">
            <span class="name">
              {{track.data.name}}
            </span>
          </div>
          <div class="ellipsis">
            <span class="artists">
              {{$controllers.track.getArtistsString(track)}}
            </span>
          </div>
          <div class="ellipsis">
            <span class="playlists">
              Inside <b>{{$controllers.track.getPlaylistsString(track)}}</b>
            </span>
          </div>
        </div>
      </div>
    </banner>
  </div>
</template>

<script>
import Banner from '../Generic/Banner'
import Card from '../Generic/Card'
export default {
  components: {
    Banner,
    Card
  },
  data () {
    return {
      cardOptions: {
      }
    }
  },
  computed: {
    trackFormatted () {
      const itm = this.track
      const album = itm.album || itm.data.album
      return itm && {
        image: album && album.images && album.images[0] && album.images[0].url
      }
    },
    cardItem () {
      return {
        backgroundImage: this.trackFormatted.image
      }
    }
  },
  props: {
    track: Object,
    isDownload: Boolean,
    downloadStatus: {
      type: Object,
      required: false,
      default: {
        state: 'awaiting'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .track-banner-container {
    height: 7em;
    transition: opacity var(--transition-global), background-color var(--transition-global);
    z-index: 0;
    position: relative;
    &.download {
      &.awaiting, &.finished {
        opacity: .5;
      }
      &.downloading, &.extracting, &.tags {
        background-color: var(--global-grey)
      }
      &[class*="_end"] {
        .background-progress {
          opacity: 0;
        }
      }
    }
  }
  .track-image {
    width: 7em;
    min-width: 7em;
    height: 100%;
    position: relative;
  }
  .track-data {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 1em 1.5em;
    box-sizing: border-box;
  }
  .background-progress {
    position: absolute;
    left: 0;top: 0;bottom: 0;
    width: var(--progress);
    transition: width 1s var(--bezier-chill), opacity .2s var(--bezier-chill);
    z-index: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;

    &.downloading {
      background: linear-gradient(258.84deg, rgba(36, 255, 0, 0.75) 1.53%, rgba(0, 255, 136, 0.75) 100%);
    }
    &.extracting {
      background: linear-gradient(258.84deg, rgba(148, 0, 204, 0.75) 1.53%, rgba(251, 0, 255, 0.75) 100%);
    }
    &.tags {
      --p: #ffe500 -150%, #ff00ff;
      animation: background-cycle-less 5s infinite var(--bezier-chill);
    }

    .progress-label {
      padding: .2em .3em;
      white-space: nowrap;
    }
  }
  .track-info {
    padding-left: .7em;
    > div > span {
      line-height: 1;
    }
    $name-size: 2em;
    text-align: left;
    .name {
      font-weight: 500;
      font-size: $name-size;
    }
    .artists {
      font-size: $name-size * .4;
    }
    .playlists {
      font-size: $name-size * .3;
    }
  }

  .see-track-link {
    position: absolute;
    cursor: pointer;
    $w: 1.5em;
    left: -$w;
    width: $w;
    top: 0;bottom: 0;
    writing-mode: tb-rl;
    transform: rotate(180deg);
    opacity: .7;
    > span {
      display: inline-block;
      // padding-bottom: .5em;
      font-size: 0.4em;
    }
  }
</style>
<style lang="scss">
  .card-container.track-banner-card {
    .card-background {
      .gradient {
        --gradient-offset: 0%;
      }
      .card-img {
        --card-img-width: 100%;
      }
    }

  }
</style>