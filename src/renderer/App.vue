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
    handleMetaKeyCombo (keyCode) {
      switch (keyCode) {
        case 219:
          return this.$sbRouter.goBack()
        case 221:
          return this.$sbRouter.goForward()
        case 68:
          return this.$sbRouter.push({name: 'downloads-view'})
        default:
      }
    },
    handleWindowKey (e) {
      const {keyCode, metaKey} = e
      if (metaKey && keyCode !== 8) return this.handleMetaKeyCombo(keyCode, e)
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
      const tracks = this.$root.DOWNLOADED_TRACKS

      if (!tracks[track.spotify_id]) tracks[track.spotify_id] = {}
      if (!tracks[track.spotify_id][track.youtube_id]) tracks[track.spotify_id][track.youtube_id] = { playlists: [] }

      const id = this.getPlaylistIdFromFoldername(track.playlist)
      if (!id) return
      tracks[track.spotify_id][track.youtube_id].playlists.push(id)

      this.propagateFileChange({...track, playlistId: id})
    },
    onRemovedTrack (e, track) {
      const tracks = this.$root.DOWNLOADED_TRACKS

      if (!tracks[track.spotify_id] || !tracks[track.spotify_id][track.youtube_id]) return
      const trackRef = tracks[track.spotify_id][track.youtube_id]
      const id = this.getPlaylistIdFromFoldername(track.playlist)
      if (!id) return

      trackRef.playlists = trackRef.playlists.filter(p => p !== id)
      if (!trackRef.playlists.length) {
        tracks[track.spotify_id][track.youtube_id] = undefined
      }
      this.propagateFileChange({...track, playlistId: id})
    },
    propagateFileChange (track) {
      const path = this.$sbRouter.giveMeCurrent() || {}
      switch (path.name) {
        case 'playlist-view':
          if (path.params.id !== track.playlistId) return
          if (this.propagationTimeout) clearTimeout(this.propagationTimeout)
          this.propagationTimeout = setTimeout(() => {
            this.$root.PlaylistViewInstance.computeTracks()
            this.propagationTimeout = null
          }, 200)
          break
      }
    },
    onRetrievedTracks (e, tracks) {
      for (const primKey in tracks) {
        for (const secKey in tracks[primKey]) {
          tracks[primKey][secKey].playlists = tracks[primKey][secKey].playlists.map(p => this.getPlaylistIdFromFoldername(p))
        }
      }
      this.$root.DOWNLOADED_TRACKS = tracks
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
    this.$root.DOWNLOADED_TRACKS = {}
    // window.ipc.on('FileWatchers:READY', (e, tracks) => {
    //   this.$root.DOWNLOADED_TRACKS = tracks
    // })
    window.ROOT = this.$root
    window.VUEX = this.$store
    window.VUEX_CURRENT_USER = this.$store.state.CurrentUser
    window.sbDebug = this
  },
  mounted () {
    this.$root.plTransformInvalidation = 0
    this.$root.OPEN_MODAL = this.$store._actions.openModal[0]
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
