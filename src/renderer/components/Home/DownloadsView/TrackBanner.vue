<template>
  <div class="track-banner-container w100" :class="isDownload ? 'download ' + downloadStatus.state : isConversion ? 'conversion' : ''">
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
          <div class="df alic">
            <div v-if="isConversion" class="sb-tag mr-1 hidable-item gradient-background-cycle-less" :class="{hidden: !isSelected}" style="--fz: .7em">
              <b>
                Selected
              </b>
            </div>
            <div class="df alic text-secondary" v-if="isConversion && trackFormatted.issue">
              <div class="svg-icon" style="--size: .75em; margin-right: .3em" v-if="trackFormatted.issue.warn">
                <warning-icon></warning-icon>
              </div>
              <span class="conversion-status df alic">
                <span class="bold point75-em color-transition" :style="{color: trackFormatted.issue.color || ''}">
                  {{trackFormatted.issue.msg}}
                </span>
              </span>
            </div>
          </div>
          <div class="ellipsis lh1point5">
            <span class="name" v-html="trackFormatted.name">
            </span>
          </div>
          <div class="ellipsis">
            <span class="artists">
              {{trackFormatted.creator}}
            </span>
          </div>
          <div v-if="isConversion" class="track-controls df mt-1">
            <button :class="{hidden: !canSelect}" class="hidable-item link-button m-0" style="margin-right: .5em" @click="select">
              {{isSelected && isDoubtly ? 'Apply Selection' : 'Select'}}
            </button>
            <button class="link-button m-0" @click="openVideo">
              Open
            </button>
          </div>
          <div v-if="!isConversion" class="ellipsis">
            <span class="playlists">
              Inside <b>{{$controllers.track.getPlaylistsString(track)}}</b>
            </span>
          </div>
          <div v-if="!isConversion && !isDownload" class="df">
            <span class="bold uppercase point5-em color-transition" v-if="trackFormatted.status" :style="{color: trackFormatted.status.color}">
              {{trackFormatted.status.str}}
            </span>
          </div>
        </div>
        <div class="duration" v-if="!isDownload">
          <div class="default-title bold" :style="{color: duration.color}" style="--fz: 2em">
            {{duration.str}}
          </div>
        </div>
      </div>
    </banner>
  </div>
</template>

<script>
import Banner from '../Generic/Banner'
import Card from '../Generic/Card'
import WarningIcon from '@/assets/icons/warning-icon'
export default {
  components: {
    Banner,
    Card,
    WarningIcon
  },
  data () {
    return {
      cardOptions: {
      }
    }
  },
  computed: {
    canSelect () {
      return this.isConversion && (!this.isSelected || this.isDoubtly)
    },
    isDoubtly () {
      return this.track.isDoubtlyConversion && !this.parentRef.flags.selectionIsApplied
    },
    trackFormatted () {
      const itm = this.track
      const snippet = itm.snippet || {}
      let image
      if (!this.isConversion) {
        const album = itm.album || itm.data.album
        image = album && album.images && album.images[0] && album.images[0].url
      } else image = snippet.thumbnails.high.url
      return itm && {
        name: this.isConversion ? itm.isCustomTrack ? snippet.title : itm.nameFormatted : itm.data.name,
        image,
        creator: this.isConversion ? snippet.channelTitle : this.$controllers.track.getArtistsString(itm),
        status: itm.status,
        issue: (() => {
          if (!this.isConversion) return null
          if (!itm.isCustomTrack && (itm.isDoubtlyConversion)) {
            return {
              msg: ((itm.wordScore === 0 || !itm.nameTokensMap[0]) ? 'Name' : 'Duration') + ' doesn\'t match',
              warn: true
            }
          }
          if (itm.isCustomTrack) return {
            msg: 'Custom',
            color: 'var(--custom-selection-color)'
          }
        })()
      }
    },
    duration () {
      if (this.isDownload) return
      // if (!this.isConversion) return {str: Math.round(this.track.duration || this.track.data.duration_ms / 1000) + "''", color: this.durationColor()}
      // return {str: Math.round(this.track.duration || this.track.data.duration_ms / 1000) + "''", color: this.durationColor()}
      const durationDiff = this.isConversion && (this.parentRef.duration || this.parentRef.data.duration_ms / 1000) - this.track.duration
      const obj = {
        str: this.$controllers.utils.minsFromSecs(Math.round(this.track.duration || this.track.data.duration_ms / 1000)),
        color: this.durationColor(durationDiff)
      }
      return obj
    },
    cardItem () {
      return {
        backgroundImage: this.trackFormatted.image
      }
    }
  },
  methods: {
    durationColor (durationDiff = 0) {
      const factor = 150
      const deg = factor - factor * Math.pow(Math.abs(durationDiff / factor), 0.5)
      return `hsl(${deg < 0 ? 0 : deg}, 100%, 50%)`
    },
    select () {
      this.$emit('select')
    },
    openVideo () {
      this.$controllers.core.openVideo(this.track.youtube_id || this.track.id)
    }
  },
  props: {
    track: Object,
    parentRef: Object,
    isDownload: Boolean,
    isConversion: Boolean,
    isSelected: Boolean,
    downloadStatus: {
      type: Object,
      required: false,
      default: () => ({
        state: 'awaiting'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
$err1: rgba(255, 0, 100, 0.75) 1.53%;
$err2: rgba(255, 35, 0, 0.75) 100%;
$error-bg: linear-gradient(258.84deg, $err1, $err2);

$dl1: rgba(36, 255, 0, 0.75) 1.53%;
$dl2: rgba(0, 255, 136, 0.75) 100%;
$download-bg: linear-gradient(258.84deg, $dl1, $dl2);

$ex1: rgba(148, 0, 204, 0.75) 1.53%;
$ex2: rgba(251, 0, 255, 0.75) 100%;
$extraction-bg: linear-gradient(258.84deg, $ex1, $ex2);
  .track-banner-container {
    height: 7em;
    transition: opacity var(--ts-g), background-color var(--ts-g);
    z-index: 0;
    position: relative;
    &.download {
      &.awaiting, &.finished {
        opacity: .5;
      }
      &.downloading, &.extracting, &.tags {
        background-color: var(--global-grey);
        box-shadow: inset 0px 0 48px 17px #0005;
      }
      &[class*='end'] {
        .background-progress {
          opacity: 0;
        }
      }
      &[class*='error'] {
        .background-progress {
          --progress: 100% !important;
          background: $error-bg;
        }
      }
    }
    &.conversion {
      .track-info .name {
        font-size: 1em;
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
    transition: var(--banner-background-transition);
    z-index: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    box-shadow: inset 0px 0 48px 17px #0004;

    &.downloading {
      background: $download-bg;
    }
    &.extracting {
      background: $extraction-bg;
    }
    &.tags {
      --p: #ffe500 -150%, #ff00ff;
      animation: background-cycle-less 5s infinite var(--bezier-chill);
      --progress: 100% !important;
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
      font-weight: bold;
      display: flex;
      margin-top: .2em;
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