<template>
  <Card @click="handleClick" :pressed="isQueued" :item="playlistFormatted">
    <div class="playlist-data">
      <div v-if="isSynced" class="track-changes-container">
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
        <div class="playlist-status-indicator" :class="statusObj.class">
          <span class="bold uppercase">
            {{statusObj.text}}
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
    playlist: Object
  },
  data () {
    return {
      playlistName: this.$props.playlist.name
    }
  },
  computed: {
    playlistFormatted () {
      return (this.playlist && {
        ...this.playlist,
        backgroundImage: this.playlistImage
      }) || {}
    },
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
    addPlaylistToSyncQueue () {
      if (!this.isQueued) this.restoreTransformation(true)
      this.$store.dispatch('queuePlaylist', this.playlist.id)
    },
    unsync () {
      this.$store._actions.openModal[0]({
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
$transition-soft:  var(--local-hover-transition);
$transition-hard: .5s var(--bezier);
$hovering-transition: .3s $bezier-tranka;

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