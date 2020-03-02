<template>
  <div :class="{'queued': isQueued, 'synced': isSynced}" class="pl-container col-lg-4 col-md-6 col-xs-12">

    <div class="dcontents" v-if="!v2">
      <div class="pl-track-count">
        {{playlist.tracks.total}} {{playlist.tracks.total === 1 ? 'Track' : 'Tracks'}}
        <div v-if="isSynced" class="star-icons-container">
          <div v-if="playlist.tracks.added && playlist.tracks.added.length > 0" class="star-icon">
            <div class="rotate">
              <star-icon color="#0fb300" />
            </div>
            <div class="num">+{{playlist.tracks.added.length}}</div>
          </div>
          <div
            v-if="playlist.tracks.removed && playlist.tracks.removed.length > 0"
            class="star-icon"
          >
            <div class="rotate">
              <star-icon color="#e33" />
            </div>
            <div class="num">-{{playlist.tracks.removed.length}}</div>
          </div>
        </div>
      </div>
      <div
        class="pl-img"
        :style="playlist.images.length > 0 ? {backgroundImage: `url(${playlist.images[0].url})`} : null"
      >
        <div class="pl-button-container">
          <button class="button" @click="$emit('openPlaylist')">Explore</button>
          <button
            v-if="!isSynced"
            class="button"
            @click="addPlaylistToSyncQueue"
          >{{isQueued ? 'Unqueue' : 'Queue'}}</button>
          <button v-if="isSynced" class="button" @click="unsync">Unsync</button>
        </div>
        <playlist-icon v-if="playlist.images.length === 0" />
      </div>
      <div class="pl-name" ref="plname">
        <!-- TODO handle multi line names -->

        {{playlistName}}
      </div>
      <div class="queued-indicator" />
    </div>


    <div class="transformation-parent rel-full" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @mousedown="setMouseListener" @click="handleClick">
      <div class="content" ref="content-container">
        <div class="playlist-side top"></div>
        <div class="playlist-side right"></div>
        <div class="playlist-side bottom"></div>
        <div class="playlist-side left"></div>
        <div class="playlist-background abs-full">
          <div class="rel-full ovfh">
            <div class="pl-img" :style="{backgroundImage: `url(${playlistImage})`}">
            </div>
            <div class="gradient">
            </div>
            <div class="light-shine" ref="light-shine"></div>
          </div>
        </div>
        <div class="playlist-data">
          <div class="title">
            <span class="bold">
              {{playlistName}}
            </span>
          </div>
          <div class="track-ammount">
            <span class="regular">
              {{trackAmmountStr}}
            </span>
          </div>
          <div class="playlist-status-indicator" :class="statusObj.class">
            <span class="bold uppercase">
              {{statusObj.text}}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import 'vuex'

import PlaylistIcon from '../../assets/icons/playlist-icon'
import StarIcon from '../Icons/star-icon'

export default {
  props: {
    playlist: Object
  },
  data () {
    return {
      playlistName: this.$props.playlist.name,
      v2: true,
      bounds: {
        bounds: null,
        timeStamp: -1
      }
    }
  },
  computed: {
    isQueued () {
      return this.$store.getters.PlaylistIsQueued(this.playlist.id) >= 0
    },
    isSynced () {
      return this.playlist && this.$store.getters.PlaylistIsSynced(this.playlist.id)
    },
    playlistImage () {
      return this.playlist && this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    trackAmmount () {
      return this.playlist && this.playlist.tracks && this.playlist.tracks.total
    },
    trackAmmountStr () {
      return this.trackAmmount + ' Track' + (this.trackAmmount === 1 ? '' : 's')
    },
    status () {
      if (this.isSynced) return 'synced'
      else return null
    },
    statusObj () {
      let devolvio = {
        class: 'unsynced',
        text: 'click to sync'
      }
      switch (this.status) {
        case 'synced':
          devolvio.class = 'synced'
          devolvio.text = 'synced'
          break
        case null:
          break
      }
      return devolvio
    }
  },
  methods: {
    handleClick () {
      if (this.isSynced) {
        this.$emit('openPlaylist')
      } else {
        this.addPlaylistToSyncQueue()
      }
    },
    onMouseMove (e) {
      this.hovering = true
      this.transformContainer(e)
    },
    onMouseLeave () {
      this.hovering = false
      this.restoreTransformation()
    },
    setMouseListener () {
      this.$(window).on('mouseup', this.restoreTransformation)
    },
    promiseNextTick () {
      return new Promise((resolve, reject) => this.$nextTick(resolve))
    },
    addPlaylistToSyncQueue () {
      if (!this.isQueued) this.restoreTransformation(true)
      this.$store.dispatch('queuePlaylist', this.playlist.id)
    },
    unsync () {
      this.$store._actions.openModal[0]({
        wich: 'unsync',
        payload: { id: this.playlist.id }
      })
    },
    getBounds () {
      /* eslint-disable no-return-assign */
      return this.$root.plTransformInvalidation < this.bounds.timeStamp ? this.bounds.bounds : (this.bounds = {timeStamp: Date.now(),
        bounds: (() => {
          let bounds = this.$refs['content-container'].getBoundingClientRect();
          ['x', 'y', 'width', 'height'].forEach(k => bounds[k] = bounds[k].toFixed(2))
          return bounds
        })()}).bounds
    },
    transformContainer ({clientX, clientY}) {
      if (window.MOUSE_BEING_CLICKED) return
      const bounds = this.getBounds()
      const {x, y, width, height} = bounds

      const valX = (clientX - x) / width
      const valY = (clientY - y) / height

      const tX = ((valX - 0.5) * 90 * 0.1).toFixed(4)
      const tY = ((valY - 0.5) * 90 * 0.2).toFixed(4)
      this.getRotationElement().css('transform', `perspective(1000px) rotateX(${tY}deg) rotateY(${tX}deg) ${this.isQueued ? '' : 'scale3d(1.05, 1.05, 1)'}`)

      this.getLightShineElement().css({'background-position': `${(valX * 100 / 3).toFixed(2)}% 0`, transform: `rotate(${-tY / 2}deg)`})
    },
    restoreTransformation (force) {
      /* eslint-disable no-constant-condition */
      if (!force && (window.MOUSE_BEING_CLICKED || this.hovering)) return
      this.$(window).off('mouseup', this.restoreTransformation)
      this.getRotationElement().css('transform', '')
      this.getLightShineElement().css({'background-position': '', transform: ''})
    },
    getRotationElement () {
      return this.rotationElement || (this.rotationElement = this.$(this.$refs['content-container']))
    },
    getLightShineElement () {
      return this.lightShineElement || (this.lightShineElement = this.$(this.$refs['light-shine']))
    }
  },
  components: {
    PlaylistIcon,
    StarIcon
  }
}
</script>

<style lang="scss" scoped>
$q-false-color: #1b1b1b;
$q-true-color: rgb(103, 214, 0);

$playlist-height: 4em;
$title-size: .8em;
$transition-soft:  1s cubic-bezier(0.12, 0.82, 0, 1);
$transition-hard:  .5s var(--bezier);
.pl-container {
  box-sizing: border-box;
  padding: 1.5em var(--container-padding-x);
  padding-top: 0;
  z-index: 0;
  &:not(.queued).transformation-parent {
    &:hover {
      transform: scale(1.03);
      .playlist-background {
        .light-shine {
          transition: opacity $transition-soft;
          opacity: 1;
        }
      }
    }
  }
  .transformation-parent {
    &:hover {
      transform: scale(1.03);
      .playlist-background {
        .light-shine {
          transition: opacity $transition-soft;
          opacity: 1;
        }
      }
    }
    transition: transform $transition-soft, opacity $transition-soft;
    perspective: 1000px;
    perspective-origin: 50% 100px;
    &:active {
      transition: transform $transition-hard, opacity $transition-hard;
      transform: scale(.98);
      opacity: .7;
    }

    > .content {
      cursor: pointer;
      position: relative;
      background: $q-false-color;
      $transition: 0.5s cubic-bezier(0.12, 0.82, 0, 1);
      transition: background-color $transition,
      box-shadow $transition, outline-width 0.1s ease;
      transform-style: preserve-3d;
      will-change: transform;
      color: #f0f0f0;
      // box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4);
    }
  }

  .playlist-side {
    position: absolute;
    background: linear-gradient(#222 20%, transparent);
    width: 100%;
    height: 100px;
    &.top {
      // background: violet;
      transform: rotateX(-96deg) translatez(-1.666666em) translatey(1.833333em);
    }
    &.bottom {
      // background: green;
      // transform: rotateX(-81deg) translatez(95px) translatey(61px);
      transform: rotateX(-85deg) translatez(3.54em) translatey(1.88em);
    }
    &.right {
      // background: red;
      transform: rotateY(-96deg) translatez(-50px) translatey(55px);
      display: none;
    }
    &.left {
      // background: blue;
      transform: rotateX(-96deg) translatez(-50px) translatey(55px);
      display: none;
    }
  }

  .playlist-background {
    .rel-full {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .gradient {
      position: absolute;
      $offset: -3px;
      top: $offset;
      bottom: $offset;
      right: $offset;
      left: $offset;
      background: linear-gradient(to right, $q-false-color 50%, transparent 200%);
    }
    .light-shine {
      position: absolute;
      $offset: -30px;
      top: $offset;
      bottom: $offset;
      right: $offset;
      left: $offset;
      transition: opacity $transition-soft, background-position $transition-soft, transform $transition-soft;
      // transition: opacity $transition-soft;
      opacity: .5;
      background: linear-gradient(31deg, transparent 50%, rgba(255,255,255,.045) 50%, transparent 100%);
      background-size: 200%;
      background-position: center;
    }
    .pl-img {
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      height: 100%;
      width: 50%;
    }
  }

  .playlist-data {
    text-align-last: left;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0.6em .5em;
    height: $playlist-height;

    .title {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      > span {
        font-size: $title-size;
      }
    }
    .track-ammount {
      > span {
        font-size: $title-size * .75;
      }
    }
    // .status-indicator {
    //   &.synced {
    //     color: var(--green-accept)
    //   }
    //   &.unsynced {
    //     color: var(--button-purple)
    //   }
    //   > span {
    //     font-size: $title-size * .75;
    //   }
    // }
  }

  // -----------------STATES-----------------

  &.queued {
    .transformation-parent {
      transform: scale(.9);
      opacity: .7;
      &:active {
        transform: scale(.85);
        opacity: .5;
      }
    }
  }

}

</style>

<style lang="scss">
$title-size: .8em;
  .playlist-status-indicator {
    &.synced {
      color: var(--green-accept)
    }
    &.unsynced {
      color: var(--button-purple)
    }
    > span {
      font-size: $title-size * .75;
    }
  }
</style>