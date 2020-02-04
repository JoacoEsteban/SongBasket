<template>
  <div class="tb-container" @dblclick="maximize">
    <div class="tb-selection-numbers-container">
      <div id="title-bar" class="mac" v-if="isMac">
        <div class="title-bar-buttons-container">
          <button id="min-btn" class="bar-btn button-minimize">
            <div class="mask"></div>
          </button>
          <button id="max-btn" class="bar-btn button-maximize">
            <div class="mask"></div>
          </button>
          <button id="close-btn" class="bar-btn button-close">
            <div class="mask"></div>
          </button>
        </div>
      </div>
      <div class="numbers">
        <div>
          <span class="tb-selection-num">{{selectedPlaylistsData.playlists[0]}}</span>
          {{selectedPlaylistsData.playlists[1]}}
        </div>
        <div>
          <span class="tb-selection-num">{{selectedPlaylistsData.tracks[0]}}</span>
          {{selectedPlaylistsData.tracks[1]}}
        </div>
      </div>
    </div>

    <div class="tb-mid-section">
      {{status}}
      <router-link class="nodrag" style="font-size: 1.5em;" to="/home" tag="span">
        <home-icon class="nodrag" />
      </router-link>
    </div>

    <div class="tb-button-panel" :class="{h100: !isMac}">
      <div class="df fldc aliend">
        <div id="title-bar" class="windows" v-if="!isMac">
          <div class="title-bar-buttons-container">
            <div id="min-btn" class="bar-btn button-minimize">
              <div class="mask"></div>
            </div>
            <div id="max-btn" class="bar-btn button-unmaximize">
              <div class="mask"></div>
            </div>
            <div id="close-btn" class="bar-btn button-close">
              <div class="mask"></div>
            </div>
          </div>
        </div>

        <div class="tb-button-container nodrag">
          <!-- TODO Disable this button in PlaylistView -->
          <div @click="$emit('refreshPlaylists')" class="tb-button sync-icon">
            <sync-icon></sync-icon>
          </div>

          <div class="tb-button cloud-search-icon" @click="$emit('youtubeConvert')">
            <cloud-search-icon></cloud-search-icon>
          </div>

          <div @click="$emit('download')" class="tb-button download-icon">
            <download-icon></download-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="loading-bar" ref="loadingbar">
      <div class="actual-loading-bar gradient-background-cycle-less">
      </div>
    </div>
  </div>
</template>

<script>
import { dateFormatter } from '../../../UTILS'

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
      user: this.$store.state.CurrentUser.user,
      isMac: window.platform === 'mac',
      loadingBar: {
        loading: false,
        staticLoading: false,
        percentage: 0,
        animationDuration: 1000
      }
    }
  },
  mounted () {
    window.bar = this
    // document.documentElement.style.setProperty('--loading-bar-animation-duration', (this.loadingBar.animationDuration / 100) + 's')
    this.$refs.loadingbar.style.setProperty('--animation-duration', this.loadingBar.animationDuration + 'ms')
  },
  computed: {
    selectedPlaylistsData: function () {
      let st = this.$store.getters.SelectedPlaylistsCompute
      let ret = {
        playlists: [
          st.playlists,
          'Playlist' + (st.playlists === 1 ? '' : 's') + ' selected'
        ],
        tracks: [st.tracks, 'Track' + (st.tracks === 1 ? '' : 's')]
      }
      return ret
    },
    now () {
      let separator = ' / '
      let thisDate = dateFormatter(this.$store.state.CurrentUser.lastSync)
      let hours = thisDate.time.hours + ':' + thisDate.time.minutes
      let date = ''
      if (thisDate.date.today) date = 'Today'
      else {
        date =
          thisDate.date.month +
          separator +
          thisDate.date.date +
          (!thisDate.date.sameYear ? separator + thisDate.date.year : '')
      }

      return { date, hours }
    },
    loadingState () {
      return this.$store.state.Events.FETCH_LOADING_STATE
    },
    status () {
      if (!this.loadingState.value) {
        return `Last Sync: ${this.now.date} @ ${this.now.hours}`
      }
      return this.loadingState.target
    }
  },
  watch: {
    loadingState (val) {
      this.handleLoadingState(val)
    }
  },
  methods: {
    hideLoadingBar () {
      this.removeBarClass(['static', 'dynamic'])
      this.addBarClassTemp('hide')
    },
    showLoadingBar () {
      // this.loadingBar.staticLoading = val.target.includes('Getting Playlist')
      this.addBarClass('static')
      this.removeBarClass('hide', 'dynamic')
    },
    handleLoadingState (val) {
      // console.log('Loading', JSON.parse(JSON.stringify(val)))
      this.loadingBar.loading = val.value
      if (!val.value) {
        this.hideLoadingBar()
      } else {
        this.showLoadingBar()
      }
    },
    maximize (e) {
      if (!this.isMac || e.target.classList.contains('nodrag')) return
      console.log(e.target.classList)
      window.toggleMaximization()
    },
    addBarClass (className) {
      if (typeof className === 'string') className = [className]
      className.forEach(name => {
        this.$refs.loadingbar.classList.add(name)
      })
    },
    addBarClassTemp (className) {
      this.addBarClass(className)
      setTimeout(() => {
        this.removeBarClass(className)
      }, this.loadingBar.animationDuration * 1.5)
    },
    removeBarClass (className) {
      if (typeof className === 'string') className = [className]
      className.forEach(name => {
        this.$refs.loadingbar.classList.remove(name)
      })
    }
  }
}
</script>

<style lang="scss">
.tb-container {
  text-align: left;
  min-height: 3.5rem;
  width: 100%;
  display: flex;
  -webkit-app-region: drag;
  /* position: sticky; */
  /* top: 0; */
  background: var(--global-grey);
  flex-direction: row;
  flex-wrap: nowrap;
  /* margin-bottom: 1rem; */
  z-index: 10;
  justify-content: space-between;
  position: relative;
}

.nodrag {
  -webkit-app-region: no-drag;
}
.tb-selection-numbers-container {
  font-size: 0.5rem;
  box-sizing: border-box;
  width: 10rem;
  .numbers {
    margin: 0 0 0 0.3rem;
  }
}
.tb-selection-num {
  font-size: 0.9rem;
  font-family: "Poppins Semibold";
  padding-right: 0.1rem;
}

.tb-mid-section {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  font-size: 0.5rem;
}

.tb-button-panel {
  width: 10rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
}
.tb-button-container {
  display: flex;
  justify-content: space-between;
  width: 5rem;
  padding-right: 0.6rem;
}
.tb-button {
  width: 1.2rem;
  height: 1.2rem;
  /* transition: transform .1s ease; */
}
.loading-bar {
  $bar-height: 3px;
  position: absolute;
  display: flex;
  align-items: center;
  bottom: -$bar-height;
  left: 0;
  right: 100%;
  pointer-events: none;
  $transition: var(--animation-duration) var(--bezier-chill);
  transition: left $transition, right $transition;
  .actual-loading-bar {
    height: $bar-height;
    width: 100%;
  }
  &.hide {
    right: 0;
    left: 100%;
  }
  &.static {
    left:0;
    right: 0;
  }
  &.dynamic {
    .actual-loading-bar {
      background-color: var(--green-loading);
    }
  }
}
</style>
