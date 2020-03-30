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
      <div class="title bold">
        <span>
          {{playlist.name}}
        </span>
        <!-- <div class="button" @click="downloadPlaylist">
          Download TEMP
        </div> -->
        <div class="button" @click="unsyncPlaylist">
          Unsync TEMP
        </div>
      </div>
      <div class="track-count regular">
        <span>
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
</template>

<script>
export default {
  data () {
    return {
      playlist: null
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
    statusObj () {
      let devolvio = {
        class: 'unsynced',
        text: 'not synced'
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
  created () {
    this.$sbRouter.beforeTransition(this.getPlaylist)
  },
  methods: {
    getPlaylist ({params}) {
      this.playlist = params && this.$store.getters.PlaylistById(params.id)
    },
    downloadPlaylist () {
      if (!(this.playlist && this.playlist.id)) return
      window.ipc.send('download', [this.playlist.id])
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