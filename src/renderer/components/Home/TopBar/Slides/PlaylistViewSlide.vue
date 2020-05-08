<template>
  <div v-if="playlist" class="pl-view-slide-container">
    <div class="image" :style="{'background-image': `url(${image})`}">
      <div class="rel-full">
        <div class="gradient abs-full"></div>
        <!-- <div class="gradient-y abs-full"></div> -->
      </div>
    </div>

    <div class="data">
      <div class="title df alic bold window-nodrag">
        <span>
          {{playlist.name}}
        </span>
        <div class="controls-container">
          <div class="icon-wrapper" :class="{show: showDownload}">
            <button class="icon window-nodrag" @click="downloadPlaylist">
              <download-icon>
              </download-icon>
            </button>
          </div>
          <div class="icon-wrapper" :class="{show: showUnsync}">
            <button class="icon window-nodrag" @click="unsyncPlaylist">
              <close-icon>
              </close-icon>
            </button>
          </div>
          <div class="icon-wrapper" :class="{show: showPause}">
            <button class="icon window-nodrag" @click="pausePlaylist">
              <pause-icon>
              </pause-icon>
            </button>
          </div>
          <div class="icon-wrapper" :class="{show: showUnPause}">
            <button class="icon window-nodrag" @click="pausePlaylist">
              <play-icon>
              </play-icon>
            </button>
          </div>
        </div>
      </div>
      <div class="track-count regular">
        <span>
          {{trackAmmountStr}}
        </span>
      </div>
      <div class="playlist-status-indicator" :style="{'--status-color': statusObj.color}">
        <span class="bold uppercase">
          {{statusObj.msg}}
        </span>
      </div>
    </div>
  
  </div>
</template>

<script>
import DownloadIcon from '@/assets/icons/download-icon'
import CloseIcon from '@/assets/icons/close-icon'
import PauseIcon from '@/assets/icons/pause-icon'
import PlayIcon from '@/assets/icons/play-icon'
export default {
  components: {
    DownloadIcon,
    CloseIcon,
    PauseIcon,
    PlayIcon
  },
  data () {
    return {
      playlist: null,
      statusObj: {}
    }
  },
  computed: {
    trackAmmount () {
      return this.playlist && this.playlist.tracks && this.playlist.tracks.total
    },
    trackAmmountStr () {
      return this.trackAmmount + ' Track' + (this.trackAmmount === 1 ? '' : 's')
    },
    image () {
      return this.playlist && this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    playlistTracksReComputed () {
      return this.$store.state.Events.PLAYLIST_TRACKS_RE_COMPUTED
    },
    playlistStateChanged () {
      return this.$store.state.Events.PLAYLIST_STATE_CHANGED
    },
    // -----------------
    showDownload () {
      return this.showPause
    },
    showUnsync () {
      return true
    },
    showPause () {
      return this.statusObj && !this.statusObj.slug.includes('pause')
    },
    showUnPause () {
      return !this.showPause
    }
  },
  created () {
    this.$sbRouter.beforeTransition(this.getPlaylist)
  },
  watch: {
    playlistTracksReComputed () {
      this.setStatus()
    },
    playlistStateChanged () {
      this.getPlaylist()
    }
  },
  methods: {
    getPlaylist (path = this.$sbRouter.giveMeCurrent()) {
      if (path && path.name === 'home') return
      const {params} = path
      this.playlist = params && this.$store.getters.PlaylistById(params.id)
      this.setStatus()
    },
    setStatus () {
      if (!this.playlist) return
      this.statusObj = this.$controllers.playlist.getStatus(this.playlist)
    },
    downloadPlaylist () {
      if (!(this.playlist && this.playlist.id)) return
      this.$controllers.core.download(this.playlist.id)
      this.$sbRouter.push({name: 'downloads-view'})
    },
    unsyncPlaylist () {
      this.$store.dispatch('openModal', {wich: 'unsync', payload: {id: this.playlist.id}})
    },
    pausePlaylist () {
      this.$controllers.core.pausePlaylist(this.playlist.id)
    }
  }
}
</script>

<style lang="scss" scoped>
.pl-view-slide-container {
  padding-left: var(--container-padding-x);
  position: relative;
  display: flex;
}
$tit-fz: 1.2em;
.image {
  position: absolute;
  top: 0;bottom: 0;right: 0;
  width: 12em;
  max-width: 40%;
  background-position: center;
  background-size: cover;
  .gradient {
    background: linear-gradient(to right, var(--global-grey-secondary), transparent 150%);
  }
  .gradient-y {
    background: linear-gradient(to top, var(--global-grey-secondary), transparent 150%);
  }
}
.data {
  margin-top: calc(var(--tb-title-height) * 1.5);
  margin-bottom: 1em;
  > div {
    line-height: 1;
    display: flex;
  }
  .title {
    span {
      font-size: $tit-fz;
    }
  }
  .track-count {
    span {
      font-size: $tit-fz * .5;
    }
  }
  .playlist-status-indicator {
    margin-top: .5em;
  }
}
.controls-container {
  display: flex;
  align-items: center;
  padding-left: .25em;
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
      pointer-events: all;
      transform: initial;
      padding: 0 .2em;
      opacity: 1;
      width: $icon-size;
    }
  }
  button.icon {
    &:hover {
      background-color: var(--button-purple)
    }
    box-shadow: none;
    transition: box-shadow var(--ts-g), var(--hover-n-active-transitions);
    &:active {
      opacity: 0.7;
      transform: scale(.95);
    }
    background-color: transparent;
    border-radius: 50%;
    padding: .3em;
    width: $icon-size;
    height: $icon-size;
    outline: 0;
    border: 0;
    svg {
      padding: 0;
    }
  }
}
</style>