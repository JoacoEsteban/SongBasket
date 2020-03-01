<template>
  <div class="tb-container window-drag" @dblclick="maximize">
    <div class="drop-shadow abs-full show-on-scroll"></div>
    <div class="drop-gradient abs-full hide-on-scroll"></div>

    <div class="title-bar-container abs-full">
      <div id="title-bar" class="mac title-section">
        <div class="title-bar-buttons-container" v-if="isMac">
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

      <div class="tb-mid-section title-section df aliic jucc">
        <div class="navigation left" @click="navigationBack">
          back
        </div>
        <div class="status-container">
          <span>
            {{status}}
          </span>
        </div>
        <div class="navigation right" @click="navigationForw">
          forw
        </div>
      </div>

      <div id="title-bar" class="windows title-section">
        <div class="title-bar-buttons-container" v-if="!isMac">
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
    </div>

    <div class="bar-slider-container rel-full df" :style="{'--position-ptg': sliderPosition + '%'}">
      <div class="df fldc aliend bar-slide">
        <div class="section-switcher-container">
          <div class="section-switcher-list">
            <div class="section-switch" v-for="(section, index) in sections" :key="index" :class="{active: activeSection === section.id}">
              <span class="section-title semibold">
                {{section.title}}
              </span>
            </div>
          </div>
        </div>
      </div>
      <playlist-view-slide class="bar-slide"></playlist-view-slide>
    </div>


    <div class="loading-bar" ref="loadingbar">
      <div class="actual-loading-bar gradient-background-cycle-less">
      </div>
    </div>
  </div>
</template>

<script>
import { dateFormatter } from '../../../../UTILS'

import PlaylistViewSlide from './slides/PlaylistViewSlide.vue'

import SyncIcon from '@/assets/icons/sync-icon.vue'
import CloudSearchIcon from '@/assets/icons/cloud-search-icon.vue'
import DownloadIcon from '@/assets/icons/download-icon.vue'
import HomeIcon from '@/assets/icons/home-icon.vue'
export default {
  components: {
    DownloadIcon,
    SyncIcon,
    CloudSearchIcon,
    PlaylistViewSlide,
    HomeIcon
  },
  data () {
    let sectionId = 0
    return {
      user: this.$store.state.CurrentUser.user,
      isMac: window.platform === 'mac',
      sliderPosition: 0,
      loadingBar: {
        loading: false,
        staticLoading: false,
        percentage: 0,
        animationDuration: 1000
      },
      activeSection: null,
      sections: [
        {
          id: ++sectionId,
          title: 'Tracks'
        },
        {
          id: ++sectionId,
          title: 'Playlists'
        }
      ]
    }
  },
  mounted () {
    window.bar = this
    // document.documentElement.style.setProperty('--loading-bar-animation-duration', (this.loadingBar.animationDuration / 100) + 's')
    this.$refs.loadingbar.style.setProperty('--animation-duration', this.loadingBar.animationDuration + 'ms')
    this.activeSection = this.sections.find(s => s.title === 'Playlists').id

    this.$router.beforeEach(this.handleRouterNavigation)
  },
  computed: {
    route () {
      return this.$route.name
    },
    // selectedPlaylistsData: function () {
    //   let st = this.$store.getters.SelectedPlaylistsCompute
    //   let ret = {
    //     playlists: [
    //       st.playlists,
    //       'Playlist' + (st.playlists === 1 ? '' : 's') + ' selected'
    //     ],
    //     tracks: [st.tracks, 'Track' + (st.tracks === 1 ? '' : 's')]
    //   }
    //   return ret
    // },
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
    navigationBack () {
      console.log('aa')
      this.$router.push('/home')
    },
    navigationForw () {
      // this.$router.push('/home')
    },
    handleRouterNavigation (to) {
      switch (to.name) {
        case 'playlist-view':
          this.slideTo(1)
          break
        case 'playlists-list':
          this.slideTo(0)
          break
      }
    },
    slideTo (index) {
      this.sliderPosition = -index * 100
    },
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
      if (!this.isMac || e.target.classList.contains('window-nodrag')) return
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

<style lang="scss" scoped>
// $tb-height: var(--top-bar-height);
$tb-title-height: 1em;
$loading-bar-height: 3px;

.tb-container {
  text-align: left;
  min-height: .5em;
  width: 100%;
  display: flex;
  background: var(--global-grey-secondary);
  flex-direction: row;
  flex-wrap: nowrap;
  z-index: 0;
  justify-content: space-between;
  position: relative;

  // height: $tb-height;
  transition: height var(--transition-global);
}
.title-bar-container {
  z-index: 1;
  height: $tb-title-height;
  bottom: initial;
  display: flex;

  .title-section {
    width: 100%;
    display: flex;
    &:nth-child(1) {
      align-items: flex-start
    }
    &:nth-child(2) {
      align-items: center
    }
    &:nth-child(3) {
      align-items: flex-end
    }
  }
}
.drop-gradient {
  bottom: -200%;
  top: 100%;
  z-index: -1;
  background: linear-gradient(to bottom, var(--global-grey-secondary), transparent);
  opacity: var(--scroll-opacity-inverted);
}
.drop-shadow {
  top: 100%;
  bottom: -120%;
  z-index: -1;
  background: linear-gradient(to bottom, var(--global-grey-secondary) -50%, transparent);
}

.tb-mid-section {
  padding-top: .25em;
  min-width: 50%;
  bottom: initial;
  .status-container {
    font-size: 0.5em;
    // pointer-events: none;
  }
}

.bar-slider-container {
  transition: transform 1s var(--bezier-chill);
  transform: translateX(var(--position-ptg))
}

.bar-slide {
  // display: inline-block;
  min-width: 100%;height: 100%;

}

.loading-bar {
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 0;
  left: 0;
  right: 100%;
  pointer-events: none;
  $transition: var(--animation-duration) var(--bezier-chill);
  transition: left $transition, right $transition;
  .actual-loading-bar {
    height: $loading-bar-height;
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

.section-switcher-container {
  margin: 1em var(--container-padding-x);
  // margin-top: 1em;
}
.section-switcher-list {
  display: flex;
  align-items: flex-end;
}
.section-switch {
  margin-left: .3em;
  cursor: pointer;
  span.section-title {
    font-size: .75em;
    line-height: 1;
  }
  &.active {
    span.section-title {
      font-size: 1.25em;
    }
  }
}
</style>
