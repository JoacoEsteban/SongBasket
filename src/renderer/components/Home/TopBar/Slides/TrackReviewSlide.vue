<template>
  <div class="track-review-slide-container">
    <track-banner class="parent-track-container" v-if="track" :track="track"></track-banner>
    <div class="controls-container df alic container-fluid">
      <button class="link-button" @click="pauseTrack" v-if="showPause || showUnPause">
        <span>
          {{showPause ? 'Pause' : 'Unpause'}}
        </span>
        <div class="icon-wrapper" :class="{show: showPause}">
          <button class="icon window-nodrag">
            <pause-icon>
            </pause-icon>
          </button>
        </div>
        <div class="icon-wrapper" :class="{show: showUnPause}">
          <button class="icon window-nodrag">
            <play-icon>
            </play-icon>
          </button>
        </div>
      </button>
      <button class="link-button" @click="customUrl">
        <span>
          Custom Url
        </span>
        <div class="icon-wrapper show">
          <button class="icon window-nodrag">
            <link-icon>
            </link-icon>
          </button>
        </div>
      </button>
      <button class="link-button" @click="searchYt">
        <span>
          Search YouTube
        </span>
        <div class="icon-wrapper show">
          <button class="icon window-nodrag">
            <magnifier-icon>
            </magnifier-icon>
          </button>
        </div>
      </button>
      <button :class="{hidden: !showReset}" class="link-button hidable-item" @click="reset">
        <span>
          Reset Selection
        </span>
        <div class="icon-wrapper show">
          <button class="icon window-nodrag">
            <restart-icon>
            </restart-icon>
          </button>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import TrackBanner from '../../DownloadsView/TrackBanner'
import DownloadIcon from '@/assets/icons/download-icon'
import CloseIcon from '@/assets/icons/close-icon'
import PauseIcon from '@/assets/icons/pause-icon'
import PlayIcon from '@/assets/icons/play-icon'
import LinkIcon from '@/assets/icons/link-icon'
import RestartIcon from '@/assets/icons/restart-icon'
import MagnifierIcon from '@/assets/icons/magnifier-icon'
export default {
  components: {
    TrackBanner,
    DownloadIcon,
    CloseIcon,
    PauseIcon,
    PlayIcon,
    LinkIcon,
    RestartIcon,
    MagnifierIcon
  },
  data () {
    return {
      track: null
    }
  },
  created () {
    this.$ComponentRefs.slides.TrackReview = this
  },
  computed: {
    showReset () {
      return this.track && this.track.conversion && this.track.conversion.yt.length && ((this.track.selectionObj && !this.track.selectionObj.isBestMatch) || this.track.flags.selectionIsApplied)
    },
    showPause () {
      return this.track && this.track.status && !this.track.status.slug.includes('pause')
    },
    showUnPause () {
      return !this.showPause && this.track && this.track.status && this.track.status.slug.includes('pause')
    },
    playlistTracksReComputed () {
      return this.$store.state.Events.PLAYLIST_TRACKS_RE_COMPUTED
    }
  },
  watch: {
    // playlistTracksReComputed () {
    //   this.refresh()
    // }
  },
  methods: {
    refresh () {
      console.log('onrefresh')
      this.$ComponentRefs.TrackReview && this.$ComponentRefs.TrackReview.refreshTrack()
    },
    setTrack (track) {
      this.track = track
    },
    async pauseTrack () {
      const id = this.track && this.track.id
      try {
        if (!id) throw new Error('NO TRACK ID')
        await this.$controllers.core.pauseTrack(id)
        this.refresh()
      } catch (error) {
        console.error(error)
      }
    },
    async customUrl () {
      const id = this.track && this.track.id
      try {
        if (!id) throw new Error('NO TRACK ID')
        console.log('venga')
        await this.$controllers.core.askTrackCustomUrl(id)
        console.log('dowsinho')
        this.refresh()
      } catch (error) {
        console.error(error)
      }
    },
    async reset () {
      await this.$ComponentRefs.TrackReview && this.$ComponentRefs.TrackReview.selectVideo(null)
    },
    searchYt () {
      this.$controllers.core.searchYt(this.track)
    }
  }
}
</script>

<style lang="scss" scoped>
.track-review-slide-container {
  padding-top: var(--tb-title-height)
}
.controls-container {
  display: flex;
  align-items: center;
  // padding-left: .25em;
  $icon-size: 1.5em;
  .icon-wrapper {
    box-sizing: border-box;
    width: 0;
    padding: 0;
    transition: var(--hover-n-active-transitions);
    transform: scale(.7);
    opacity: 0;
    pointer-events: none;
    &.show {
      $p: .2em;
      pointer-events: all;
      transform: initial;
      padding: 0 $p;
      opacity: 1;
      width: $icon-size + 2 * $p;
    }
  }
  button.icon {
    display: flex;
    box-shadow: none;
    transition: box-shadow var(--ts-g), var(--hover-n-active-transitions);
    &:active {
      opacity: 0.7;
      transform: scale(.95);
    }
    background-color: transparent;
    border-radius: 50%;
    padding: .3em;
    min-width: $icon-size;
    height: $icon-size;
    outline: 0;
    border: 0;
    svg {
      padding: 0;
    }
  }
}
</style>