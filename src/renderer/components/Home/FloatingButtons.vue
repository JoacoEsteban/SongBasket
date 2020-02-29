<template>
<div class="floating-buttons-container" :class="{show: showComponent}">
  <div class="gradient"></div>
  <div class="df content">
    <div class="floater">
      <div class="sb-fab" @click="refresh" :class="{show: showRefresh}">
        <sync-icon></sync-icon>
      </div>
    </div>
    <div class="floater">
      <div class="sb-fab" @click="sync" :class="{show: showSync}">
        <cloud-search-icon></cloud-search-icon>
      </div>
    </div>
    <div class="floater">right</div>
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
    return {
    }
  },
  computed: {
    route () {
      return this.$route.name
    },
    showComponent () {
      return this.route === 'playlists-list'
    },
    loadingState () {
      return this.$store.state.Events.FETCH_LOADING_STATE
    },
    loading () {
      return this.loadingState && this.loadingState.value
    },
    showRefresh () {
      return !(this.loading)
    },
    showSync () {
      return !this.loading && !this.queueIsEmpty
    },
    queue () {
      return this.$store.state.CurrentUser.queuedPlaylists
    },
    queueIsEmpty () {
      return !this.queue.length
    }
  },
  methods: {
    refresh () {
      this.$emit('refreshPlaylists')
    },
    sync () {
      this.$emit('youtubeConvert')
    }
  }

}
</script>

<style lang="scss" scoped>
$t: var(--transition-global);
$offsetY: .5em;
$gradient-height: 2em;
$whole-height: 5em;
.floating-buttons-container {
  pointer-events: none;
  position: fixed;
  bottom: -$whole-height;
  left: 0;
  right: 0;
  transition: bottom $t;
  > .content {
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
  width: 100%;
  &:nth-child(1) {
    justify-content: flex-start
  }
  &:nth-child(2) {
    justify-content: center
  }
  &:nth-child(3) {
    justify-content: flex-end
  }
}

.sb-fab {
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

  &.show {
    bottom: 0;
  }

  &:hover {
    transform: scale(1.15)
  }
  &:active {
    transform: scale(.95);
    opacity: .7;
  }
}
</style>
