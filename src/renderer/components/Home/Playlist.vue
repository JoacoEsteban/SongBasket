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


    <div class="transformation-parent rel-full" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @mousedown="setMouseListener">
      <div class="content" ref="content-container">
        <div class="playlist-background abs-full">
          <div class="rel-full ovfh">
            <div class="pl-img" :style="{backgroundImage: `url(${playlistImage})`}">
            </div>
            <div class="gradient">
            </div>
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
          <div class="status-indicator" :class="statusObj.class">
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
      if (this.playlist) return this.$store.getters.PlaylistIsSynced(this.playlist.id)
      else return false
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

      const tX = ((((clientX - x) / width) - 0.5) * 90 * 0.1).toFixed(4)
      const tY = ((((clientY - y) / height) - 0.5) * 90 * 0.2).toFixed(4)
      this.$(this.$refs['content-container']).css('transform', `perspective(1000px) rotateX(${tY}deg) rotateY(${tX}deg) scale3d(1.05, 1.05, 1)`)
    },
    async restoreTransformation () {
      if (window.MOUSE_BEING_CLICKED || this.hovering) return
      this.$(window).off('mouseup', this.restoreTransformation)
      this.$(this.$refs['content-container']).css('transform', '')
    }
  },
  components: {
    PlaylistIcon,
    StarIcon
  }
}
</script>

<style lang="scss" scoped>
$q-false-color: #272727;
$q-true-color: rgb(103, 214, 0);
$title-size: .8em;
.pl-container {
  box-sizing: border-box;
  padding: 1.5em 1.25em;
  padding-top: 0;
  .transformation-parent {
    $transition-soft:  1s cubic-bezier(0.12, 0.82, 0, 1);
    $transition-hard:  .5s var(--bezier);
    transition: transform $transition-soft, opacity $transition-soft;
    &:hover {
      transform: scale(1.03)
    }
    &:active {
      transition: transform $transition-hard, opacity $transition-hard;
      transform: scale(.98);
      opacity: .7;
    }
  }
  .transformation-parent > .content {
    cursor: pointer;
    position: relative;
    background: $q-false-color;
    $transition: 0.5s cubic-bezier(0.12, 0.82, 0, 1);
    transition: background-color $transition,
    box-shadow $transition, outline-width 0.1s ease;
    will-change: transform;
    color: #f0f0f0;
    box-shadow: 0.1em 0.1em 0.3em 0 rgba(0, 0, 0, 0.4);
  }
  z-index: 0;

  .playlist-background {
    .rel-full {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .gradient {
      // background: linear-gradient(90deg, $q-false-color 75%, rgba(0,0,0,0));
      position: absolute;
      top: -2px;
      bottom: -2px;
      right: -2px;
      left: -2px;
      background: linear-gradient(to right, black 0%, black 73%, rgba(0, 0, 0, 0.72) 85%, rgba(0, 0, 0, 0.57) 90%, rgba(0, 0, 0, 0.51) 93%, rgba(0, 0, 0, 0.38) 96%, rgba(0, 0, 0, 0) 100%);
    }
    .pl-img {
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      height: 100%;
      width: 25%;
    }
  }

  .playlist-data {
    text-align-last: left;
    position: relative;
    padding: 0.6em .5em;


    .title {
      > span {
        font-size: $title-size;
      }
    }
    .track-ammount {
      > span {
        font-size: $title-size * .75;
      }
    }
    .status-indicator {
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
  }

}

</style>
