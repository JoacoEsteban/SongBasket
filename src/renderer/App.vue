<template>
  <div  class="app-container">
      <router-view id="app">
      </router-view>
      <modal />
  </div>
</template>

<script>
import Modal from './components/Modal/Modal'
import StylesLoader from './CSS/styles-loader'
import $ from 'jquery'

function isAscii (code) {
  return code >= 48 && code <= 90
}

export default {
  name: 'SongBasket',
  components: {
    Modal,
    StylesLoader
  },
  methods: {
    redirect (path, payload) {
      path = (path[0] === '/' ? '' : '/') + path
      if (path === this.$route.fullPath) return console.error('ERROR Trying to navigate to same path')
      this.$router.push(path)
    },
    handleWindowKey ({keyCode, metaKey}) {
      if (metaKey) {
        if (keyCode === 219) return this.$sbRouter.goBack()
        if (keyCode === 221) return this.$sbRouter.goForward()
      }
      if (isAscii(keyCode) || (keyCode === 8 && this.$root.searchInputElement && this.$root.searchInputElement.value.length)) return this.focusSearchbar()
    },
    handleMouseKey ({button}) {
      switch (button) {
        case 3:
          this.$sbRouter.goBack()
          break
        case 4:
          this.$sbRouter.goForward()
          break
      }
    },
    focusSearchbar () {
      this.$root.searchInputElement && this.$root.searchInputElement.focus()
    },
    invalidatePlTransformCache () {
      this.$root.plTransformInvalidation = Date.now()
    },
    getPlaylistIdFromFoldername (name) {
      const pl = this.$store.state.CurrentUser.playlists.find(p => p.folderName === name || p.name === name)
      return pl && pl.id
    },
    onAddedTrack (e, track) {
      const tracks = this.$root.downloadedTracks

      if (!tracks[track.spotify_id]) tracks[track.spotify_id] = {}
      if (!tracks[track.spotify_id][track.youtube_id]) tracks[track.spotify_id][track.youtube_id] = { playlists: [] }

      const id = this.getPlaylistIdFromFoldername(track.playlist)
      console.log('aber', track.playlist, id)
      if (!id) return
      tracks[track.spotify_id][track.youtube_id].playlists.push(id)
      console.log('redy bb queonda', track)
    },
    onRemovedTrack (e, track) {
      const tracks = this.$root.downloadedTracks

      if (!tracks[track.spotify_id] || !tracks[track.spotify_id][track.youtube_id]) return
      const trackRef = tracks[track.spotify_id][track.youtube_id]
      const id = this.getPlaylistIdFromFoldername(track.playlist)
      if (!id) return

      trackRef.playlists = trackRef.playlists.filter(p => p !== id)
      if (!trackRef.playlists.length) {
        tracks[track.spotify_id][track.youtube_id] = undefined
      }
      console.log('Removed', track)
    },
    onRetrievedTracks (e, tracks) {
      for (const primKey in tracks) {
        for (const secKey in tracks[primKey]) {
          tracks[primKey][secKey].playlists = tracks[primKey][secKey].playlists.map(p => this.getPlaylistIdFromFoldername(p))
        }
      }
      this.$root.downloadedTracks = tracks
    }
  },
  created () {
    window.ipc.on('FileWatchers:ADDED', this.onAddedTrack)
    window.ipc.on('FileWatchers:REMOVED', this.onRemovedTrack)
    window.ipc.on('FileWatchers:RETRIEVED_TRACKS', this.onRetrievedTracks)

    window.ipc.on('initializeSetup', () => {
      // this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('setup')
    })
    window.ipc.on('dataStored', async () => {
      this.$store.dispatch('SET_LOADING_STATE', 'found')
      this.redirect('home')
    })
    $(window).on('keydown', this.handleWindowKey)
    $(window).on('mousedown', this.handleMouseKey)
  },
  beforeCreate () {
    this.$root.downloadedTracks = {}
    // window.ipc.on('FileWatchers:READY', (e, tracks) => {
    //   console.log('redy bb queonda', e, tracks)
    //   this.$root.downloadedTracks = tracks
    // })
    window.VUE_ROOT = this.$root
    window.VUEX = this.$store.state
    window.sbDebug = this
  },
  mounted () {
    this.$root.plTransformInvalidation = 0
    window.addEventListener('mousewheel', this.invalidatePlTransformCache)
    window.addEventListener('resize', this.invalidatePlTransformCache)
    $(document).ready(function () {
      setTimeout(() => {
        window.ipc.send('DOCUMENT_READY_CALLBACK')
      }, 1000)
    })
    setTimeout(() => {
      window.ipc.send('FileWatchers:ASK_TRACKS')
    }, 5000)
  }
}
</script>

<style lang="scss">
  .app-container {
    height: 100%;
    position: relative;
    z-index: 0;
  }
</style>
