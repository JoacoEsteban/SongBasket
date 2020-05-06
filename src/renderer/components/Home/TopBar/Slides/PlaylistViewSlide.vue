<template>
  <div v-if="playlist" class="pl-view-slide-container">
    <!-- FIXME container not adapting to this component height -->
    <div class="image" :style="{'background-image': `url(${image})`}">
      <div class="rel-full">
        <div class="gradient abs-full"></div>
        <!-- <div class="gradient-y abs-full"></div> -->
      </div>
    </div>

    <div class="data">
      <div class="title bold window-nodrag">
        <span>
          {{playlist.name}}
        </span>
        <div class="button" @click="downloadPlaylist">
          Download TEMP
        </div>
        <div class="button" @click="unsyncPlaylist">
          Unsync TEMP
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
export default {
  data () {
    return {
      playlist: null,
      statusObj: {}
    }
  },
  computed: {
    // playlist () {
    //   return this.$store.getters.CurrentPlaylist
    // },
    trackAmmount () {
      return this.playlist && this.playlist.tracks && this.playlist.tracks.total
    },
    trackAmmountStr () {
      return this.trackAmmount + ' Track' + (this.trackAmmount === 1 ? '' : 's')
    },
    status () {
      if (this.playlist && this.$store.getters.PlaylistIsSynced(this.playlist.id)) return 'synced'
      else return null
    },
    image () {
      return this.playlist && this.playlist.images && this.playlist.images[0] && this.playlist.images[0].url
    },
    playlistTracksReComputed () {
      return this.$store.state.Events.PLAYLIST_TRACKS_RE_COMPUTED
    }
  },
  created () {
    this.$sbRouter.beforeTransition(this.getPlaylist)
  },
  watch: {
    playlistTracksReComputed () {
      this.setStatus()
    }
  },
  methods: {
    getPlaylist (path) {
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
      this.$IPC.send('download', [this.playlist.id])
      this.$sbRouter.push({name: 'downloads-view'})
    },
    unsyncPlaylist () {
      this.$store.dispatch('openModal', {wich: 'unsync', payload: {id: this.playlist.id}})
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
</style>