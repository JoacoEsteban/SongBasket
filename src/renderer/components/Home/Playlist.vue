<template>
  <Card @click="handleClick" :pressed="isQueued" :item="playlistFormatted" :options="cardOptions" :row-classes="rowClasses">
    <div class="playlist-data">
      <div v-if="showChanges" class="track-changes-container">
        <div v-if="playlist.tracks.added && playlist.tracks.added.length" class="track-change added">
          <span class="bold">+{{playlist.tracks.added.length}}</span>
        </div>
        <div v-if="playlist.tracks.removed && playlist.tracks.removed.length" class="track-change removed">
          <span class="bold">-{{playlist.tracks.removed.length}}</span>
        </div>
      </div>

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
        <div class="playlist-status-indicator" :class="status.slug" :style="{'--status-color': status.color}">
          <span class="bold uppercase">
            {{status.msg}}
          </span>
        </div>
    </div>
  </Card>
</template>

<script>
import 'vuex'

import Card from './Generic/Card'

export default {
  props: {
    playlist: Object,
    status: Object
  },
  data () {
    return {
      controller: this.$root.$controllers.playlist,
      statusObj: {}
    }
  },
  computed: {
    isQueued () {
      return this.$store.getters.PlaylistIsQueued(this.playlist.id) >= 0
    },
    isSynced () {
      return this.status.baseState === 'synced'
    },
    isPaused () {
      return this.status && this.status.slug && this.status.slug.includes('pause')
    },
    showChanges () {
      return this.isSynced && !this.isPaused
    },
    playlistName () {
      return this.playlist.name
    },
    playlistImage () {
      return this.playlist && this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    playlistFormatted () {
      return (this.playlist && {
        ...this.playlist,
        backgroundImage: this.playlistImage
      }) || {}
    },
    trackAmmount () {
      return (this.playlist && this.playlist.tracks && this.playlist.tracks.total) || 0
    },
    trackAmmountStr () {
      return this.trackAmmount + ' Track' + (this.trackAmmount === 1 ? '' : 's')
    },
    // -------------
    cardOptions () {
      return this.isSynced ? {
        size: '.8em',
        height: '3.5em'
      } : {}
    },
    rowClasses () {
      return this.isPaused ? 'col-lg-3 col-md-5 col-xs-12' : null
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
    async addPlaylistToSyncQueue () {
      // if (!this.isQueued) this.restoreTransformation(true)
      await this.$root.$controllers.core.queuePlaylist(this.playlist.id)
    },
    unsync () {
      this.$root.OPEN_MODAL({
        wich: 'unsync',
        payload: { id: this.playlist.id }
      })
    }
  },
  components: {
    Card
  }
}
</script>

<style lang="scss" scoped>
$q-false-color: #1b1b1b;
$q-true-color: rgb(103, 214, 0);
$bezier-tranka: cubic-bezier(0.12, 0.82, 0, 1);

$playlist-height: 4em;
$title-size: .8em;

.playlist-data {
  text-align-last: left;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0;
  width: 100%;

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
}

.track-changes-container {
  position: absolute;
  display: flex;
  bottom: 0;
  right: 0;
  .track-change {
    // $size: 1.5em;
    // width: $size;
    // height: $size;
    // margin: 0 $size/10;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    &:nth-last-child(1) {
      margin-left: .3em;
    }
    > span {
      line-height: 1;
      font-size: 1.25em;
    }

    &.added {
      color: var(--green-accept);
    }
    &.removed {
      color: var(--red-cancel);
    }
  }
}
</style>

<style lang="scss">
$title-size: .8em;
  .playlist-status-indicator {
    color: var(--status-color);
    > span {
      font-size: $title-size * .75;
    }
  }
</style>