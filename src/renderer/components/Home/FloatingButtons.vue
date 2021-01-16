<template>
<div class="floating-buttons-container" :class="{show: showComponent}">
  <div class="gradient"></div>
  <div class="df jucb">
    <div class="df floater-container">
      <div class="floater rel" v-if="!forceKill.all && !forceKill.dropdown">
        <!-- <div class="dropdown"></div> -->
        <div class="sb-fab" @click="toggleDropdown" :class="{show: showDropdown}">
          <font-awesome-icon size="xs" icon="chevron-up" />
        </div>
      </div>
    </div>
    <div class="df floater-container">
      <div class="floater" v-if="!forceKill.all && !forceKill.refresh">
        <div class="sb-fab" @click="refresh" :class="{show: showRefresh}">
          <sync-icon></sync-icon>
        </div>
      </div>
      <div class="floater" v-if="!forceKill.all && !forceKill.sync">
        <div class="sb-fab" @click="sync" :class="{show: showSync}">
          <cloud-search-icon></cloud-search-icon>
        </div>
      </div>
      <div class="floater" v-if="!forceKill.all && !forceKill.download">
        <div class="sb-fab" @click="download" :class="{show: showDl}">
          <download-icon></download-icon>
        </div>
      </div>
      <div class="floater error-floater" v-if="!errorPill.kill">
        <div class="sb-fab error-pill-container" :class="{show: showError}">
          <span>
            <span v-html="errorPill.message"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>

import SyncIcon from '../../assets/icons/sync-icon.vue'
import CloudSearchIcon from '../../assets/icons/cloud-search-icon.vue'
import DownloadIcon from '../../assets/icons/download-icon.vue'
import HomeIcon from '../../assets/icons/home-icon.vue'
export default {
  components: {
    DownloadIcon,
    SyncIcon,
    CloudSearchIcon,
    HomeIcon
  },
  data () {
    this._FEATURES = global.CONSTANTS.FEATURES.FLOAT_MENU
    return {
      route: '',
      errorPill: {
        show: false,
        kill: true,
        message: 'ERROR: dou not detected'
      },
      showingDropdown: false,
      forceHide: {
        all: false,
        sync: false,
        refresh: false,
        download: false
      },
      forceKill: {
        all: false,
        sync: false,
        refresh: false,
        download: false,
        dropdown: false
      }
    }
  },
  computed: {
    // route () {
    //   return this.$route.name
    // },
    ffmpeg () {
      return this.$store.state.Events.FFMPEG_BINS_DOWNLOADED
    },
    globalError () {
      return this.$store.state.Events.GLOBAL_ERROR
    },
    showComponent () {
      return this.route === 'home'
    },
    loadingState () {
      return this.$store.state.Events.LOADING_STATE || {}
    },
    connectedToInternet () {
      return this.$store.state.SharedStates.CONNECTED_TO_INTERNET
    },
    connectedToApi () {
      return this.$store.state.SharedStates.CONNECTED_TO_API
    },
    fullConnection () {
      return this.connectedToInternet && this.connectedToApi
    },
    loadingTarget () {
      return this.loadingState.target
    },
    loading () {
      return this.loadingState.value
    },
    showRefresh () {
      return !(this.loading) && this.fullConnection && !this.forceHide.all && !this.forceHide.refresh
    },
    showSync () {
      return !this.loading && (!this.queueIsEmpty || this.syncedPls.length) && this.fullConnection && !this.forceHide.all && !this.forceHide.sync
    },
    showError () {
      return !this.showSync && this.errorPill.show
    },
    showDl () {
      return (!this.loading || this.loadingTarget === 'DOWNLOAD') && this.syncedPls.length && this.connectedToInternet && !this.forceHide.all && !this.forceHide.download && this.ffmpeg
    },
    showDropdown () {
      return !this.forceHide.all && !this.forceHide.dropdown && this._FEATURES.DROPDOWN
    },
    queue () {
      return this.$store.state.CurrentUser.queuedPlaylists
    },
    queueIsEmpty () {
      return !this.queue.length
    },
    syncedPls () {
      return this.$store.state.CurrentUser.syncedPlaylists
    }
  },
  created () {
    this.$sbRouter.beforeTransition(this.handleTransition)
  },
  async mounted () {
    await this.$sleep(1000)
    this.handleTransition()
  },
  watch: {
    globalError (val) {
      this.handleError(val)
    },
    fullConnection (val) {
      if (val) return this.hideErrorPill()
      this.handleError({
        message: this.connectedToInternet ? 'SongBasket servers are experiencing connection issues' : 'Check your connection'
      }, {
        val: true,
        time: 10000
      })
    }
  },
  methods: {
    handleTransition (to) {
      this.route = (to && to.name) || this.$sbRouter.path.name
    },
    async handleError (val, autoHide = {
      val: true,
      time: 4000
    }) {
      this.errorTimeout && clearTimeout(this.errorTimeout)
      this.errorPill.message = val.message

      this.forceHide.all = true
      await this.$sleep(400)
      this.forceKill.all = true
      this.errorPill.kill = false
      await this.$sleep(100)
      this.errorPill.show = true

      if (autoHide.val) this.errorTimeout = setTimeout(this.hideErrorPill, autoHide.time)
    },
    async hideErrorPill () {
      this.errorPill.show = false
      await this.$sleep(400)
      this.errorPill.kill = true
      this.forceKill.all = false
      await this.$sleep(100)
      this.forceHide.all = false
      await this.$sleep(400)
    },
    refresh () {
      this.$controllers.core.refresh()
    },
    sync () {
      this.$emit('youtubeConvert')
    },
    download () {
      this.$controllers.core.download()
    },
    toggleDropdown () {
      // this.showingDropdown = !this.showingDropdown
      this.$controllers.core.logOut()
    }
  }

}
</script>

<style lang="scss" scoped>
$t: var(--ts-g);
$offsetY: .5em;
$gradient-height: 5em;
$whole-height: 5em;
.floating-buttons-container {
  pointer-events: none;
  position: fixed;
  bottom: -$whole-height;
  left: 0;
  right: 0;
  transition: bottom $t;
  .floater-container {
    padding: $offsetY var(--container-padding-x);
  }
  z-index: 10;

  &.show {
    bottom: 0;
  }
}

.gradient {
  z-index: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  height: $gradient-height;

  background: linear-gradient(to top, black, transparent);
}

.floater {
  z-index: 1;
  display: flex;
  align-items: center;
  // width: 100%;
  margin-left: .5em;
  margin-right: .5em;
    &:nth-child(1) {
      justify-content: flex-start
    }
    &:nth-child(2), &.error-floater {
      justify-content: center
    }
    &:nth-child(3) {
      justify-content: flex-end
    }
}
</style>

<style lang="scss">
$offsetY: .5em;
$t: var(--ts-g);
.sb-fab {
  -webkit-app-region: no-drag;
  box-sizing: border-box;
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--button-purple);
  color: var(--text-white);
  border-radius: 10em;
  $sh-color: rgba(0,0,0,.2);

  box-shadow: inset 3px 3px 10px $sh-color, 0 4px 7px 2px $sh-color;

  $padding: .5em;
  padding: $padding;

  $size: 2em;
  width: $size;
  height: $size;

  min-width: $size;
  max-width: $size;
  min-height: $size;
  max-height: $size;

  position: relative;
  bottom: -($size + $offsetY + 1em);

  transition: transform $t, opacity $t, bottom $t;

  &.show, &.error-pill-container.show {
    bottom: 0;
  }

  &:hover {
    transform: scale(1.15)
  }
  &:active {
    transform: scale(.95);
    opacity: .7;
  }

  &.error-pill-container {
    &:hover {
      transform: scale(1.03)
    }
    &:active {
      transform: scale(.98);
      opacity: .7;
    }
    width: initial;
    height: initial;

    min-width: initial;
    max-width: initial;
    min-height: initial;
    max-height: initial;
    bottom: -120%;

    background-color: var(--red-cancel);

    font-weight: 500;
    // white-space: nowrap;
    padding-left: 1em;
    padding-right: 1em;

    span {
      font-size: .65;
    }

  }
}
</style>
