<template>
  <div class="tb-container window-drag-recursive" :class="{'showing-loading-bar': showingLoadingBar}">
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
        <div class="navigation-btn left window-nodrag" :class="{show: showPrevBtn}"  @click="navigationBack">
          <font-awesome-icon size="xs" icon="arrow-left" />
        </div>
        <div class="status-container">
          <span>
            {{status}}
          </span>
        </div>
        <div class="navigation-btn right window-nodrag" :class="{show: showForwBtn}" @click="navigationForw">
          <font-awesome-icon size="xs" icon="arrow-right" />
        </div>
      </div>

      <div class="title-section">
        <div id="title-bar" class="windows">
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
    </div>

    <div class="bar-slider-container h-fc rel-full df" :style="{'--position-ptg': sliderPosition + '%', '--animation-duration': loadingBar.animationDuration + 'ms'}">
      <div class="df fldc aliend bar-slide h-fc show">
        <div class="section-switcher-container">
          <div class="section-switcher-list">
            <div class="section-switch window-nodrag" v-for="(section, index) in sections" :key="index" :class="{active: activeSection === section.id}">
              <span class="section-title semibold" @click="section.cb">
                {{section.title}}
              </span>
            </div>
          </div>
        </div>
      </div>
      <playlist-view-slide :class="{show: currentPath === 'playlist-view'}" class="bar-slide" style="--slide-height: 6em;"></playlist-view-slide>
      <track-review-slide :class="{show: currentPath === 'track-review'}" class="bar-slide hidden-of" style="--slide-height: 10em;"></track-review-slide>
      <downloads-view-slide :class="{show: currentPath === 'downloads-view'}" class="bar-slide"></downloads-view-slide>
    </div>


    <div class="loading-bar"
      ref="loadingbar"
      :style="{'--ptg': loadingBar.ptg}"
      :class="loadingBar.classList"
    >
      <div class="actual-loading-bar gradient-background-cycle-less">
      </div>
    </div>
  </div>
</template>

<script>
import { dateFormatter } from '../../../utils'

import PlaylistViewSlide from './slides/PlaylistViewSlide.vue'
import TrackReviewSlide from './slides/TrackReviewSlide.vue'
import DownloadsViewSlide from './slides/DownloadsViewSlide.vue'

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
    TrackReviewSlide,
    DownloadsViewSlide,
    HomeIcon
  },
  data () {
    let sectionId = 0
    return {
      user: this.$store.state.CurrentUser.user,
      isMac: window.CONSTANTS.PLATFORM === 'mac',
      sliderPosition: 0,
      showingLoadingBar: false,
      loadingBar: {
        loading: false,
        staticLoading: false,
        ptg: '0%',
        animationDuration: 750,
        classList: {
          show: false,
          static: true
        }
      },
      currentPath: null,
      activeSection: null,
      showPrevBtn: this.$sbRouter.pointer,
      showForwBtn: this.$sbRouter.isLast(),
      sections: [
        {
          id: ++sectionId,
          title: 'Tracks',
          slug: 'tracks-list',
          cb: () => this.goTo('tracks-list')
        },
        {
          id: ++sectionId,
          title: 'Playlists',
          slug: 'playlists-list',
          cb: () => this.goTo('playlists-list')
        }
      ]
    }
  },
  mounted () {
    window.bar = this
    // document.documentElement.style.setProperty('--loading-bar-animation-duration', (this.loadingBar.animationDuration / 100) + 's')
    this.activeSection = this.sections.find(s => s.title === 'Playlists').id

    this.$sbRouter.beforeTransition(this.handleRouterNavigation)
    this.$sbRouter.afterTransition(this.checkNavBtns)
    this.checkNavBtns()
  },
  computed: {
    route () {
      return this.$route.name
    },
    now () {
      let separator = ' / '
      let thisDate = dateFormatter(this.$store.state.CurrentUser.lastSync || new Date())
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
      return this.$store.state.Events.LOADING_STATE
    },
    status () {
      return !this.loadingState.value ? `Last Sync: ${this.now.date} @ ${this.now.hours}` : this.loadingState.message
    }
  },
  watch: {
    loadingState (val) {
      this.handleLoadingState(val)
    }
  },
  methods: {
    checkNavBtns () {
      this.showPrevBtn = !!this.$sbRouter.pointer
      this.showForwBtn = !this.$sbRouter.isLast()
    },
    navigationBack () {
      this.$sbRouter.goBack()
    },
    navigationForw () {
      this.$sbRouter.goForward()
    },
    handleRouterNavigation (to, from) {
      this.currentPath = to.name
      switch (to.name) {
        case 'downloads-view':
        case 'track-review':
        case 'playlist-view':
          this.slideTo(1)
          break
        case 'home':
          this.slideTo(0)
          const section = this.sections.find(s => s.slug === to.params.which)
          section && (this.activeSection = section.id)
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
      this.loadingBar.ptg = (val.ptg * 100).toFixed(2) + '%'
      const classes = {}
      this.showingLoadingBar = val.value
      classes[val.value ? 'show' : 'hide'] = true
      classes[val.showPtg ? 'dynamic' : 'static'] = true
      this.loadingBar.classList = classes

      // if (!val.value) {
      //   this.hideLoadingBar()
      // } else {
      //   this.showLoadingBar()
      // }
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
    },
    goTo (where) {
      this.$sbRouter.push({name: 'home',
        params: {
          which: where
        }})
    }
  }
}
</script>

<style lang="scss" scoped>
// $tb-height: var(--top-bar-height);
$tb-title-height: var(--tb-title-height);
$loading-bar-height: 3px;

.tb-container {
  text-align: left;
  // min-height: .5em;
  min-height: fit-content;
  width: 100%;
  display: flex;
  background: var(--global-grey-secondary);
  flex-direction: row;
  flex-wrap: nowrap;
  z-index: 0;
  justify-content: space-between;
  position: relative;

  // height: $tb-height;
  transition: height var(--ts-g);
  transition-timing-function: var(--bezier-symmetric);
  &.showing-loading-bar {
    .bar-slide {
      overflow: hidden;
    }
  }
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
      justify-content: flex-start
    }
    &:nth-child(2) {
      justify-content: center
    }
    &:nth-child(3) {
      justify-content: flex-end
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
  transition: transform var(--top-bar-slider-transition);
  transform: translateX(var(--position-ptg))
}

.bar-slide {
  // display: inline-block;
  min-width: 100%;
  box-sizing: border-box;
  transition: height var(--top-bar-slider-transition);
  height: var(--slide-height);
  &:not(.show) {
    --slide-height: 0 !important;
  }
  &.hidden-of {
    overflow: hidden;
  }
}

.loading-bar {
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 0;
  left: 0;
  right: 100%;
  pointer-events: none;
  // $transition: var(--animation-duration) var(--bezier-chill);
  $transition: var(--ts-g);
  transition: left $transition, right $transition, width $transition;
  .actual-loading-bar {
    height: $loading-bar-height;
    width: 100%;
  }
  --ptg: 0%;
  width: var(--ptg);
  &.show {
    &.static {
      left:0;
      width: 100%;
    }
    &.dynamic {
      .actual-loading-bar {
        animation: none;
        background-color: var(--green-accept);
      }
    }
  }
  &.hide {
    left: 100%;
    width: 100%;
  }
  &.kill {
    opacity: 0;
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
  opacity: 0.5;
  span.section-title {
    font-size: .75em;
    line-height: 1;
    transition: font-size var(--ts-g);
  }
  transition: var(--hover-n-active-transitions);
  &:not(.active) {
    &:hover {
      opacity: 0.8;
    }
    &:active {
      opacity: 0.5;
      transform: scale(.98);
    }
  }
  &.active {
    opacity: 1;
    span.section-title {
      font-size: 1.25em;
    }
  }
}

.navigation-btn {
  cursor: pointer;
  display: flex;
  $m: .5em;
  &.right {
    margin-left: $m;
  }
  &.left {
    margin-right: $m;
  }
  transition: opacity var(--ts-g), transform var(--ts-g);

  opacity: .1;
  transform: scale(.8);

  &.show {
    opacity: 1;
    transform: scale(1);
  }
}
.global-search-bar-container {
  position: absolute;
  $h: 4em;
  width: 100%;
  height: $h;
  bottom: -$h;
  outline: 1px solid red;
}
</style>
