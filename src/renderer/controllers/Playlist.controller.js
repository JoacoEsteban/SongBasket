let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const env = {
  get vue () {
    return getVueInstance()
  },
  get store () {
    return getVueInstance().$store
  },
  get root () {
    return getVueInstance().$root
  }
}
const PlaylistController = {
  getObject (id) {
    console.log('ID?', id)
    const obj = id && (env.store.state.CurrentUser.playlists.find(pl => pl.id === this.playlistId) || {})
    console.log('OBJ?', obj)
    return obj
  },
  isSynced (id) {
    return id && env.store.getters.PlaylistIsSynced(id)
  },
  getStatus (playlist) {
    if (!playlist) return {}
    let status = {}

    if (!this.isSynced(playlist.id)) return statuses.unsynced
    if (!env.root.CONVERTED_TRACKS_FORMATTED) return {}
    if (playlist.isPaused) return statuses.paused
    let errors = 0
    let doubtly = 0
    let dirts = 0
    let toDownload = 0
    playlist.tracks.items.map(t => env.root.CONVERTED_TRACKS_FORMATTED.find(track => track.id === t.id)).forEach(({flags, selectionObj, status}) => {
      switch (status && status.slug) {
        case undefined:
        case 'error':
          ++errors
          break
        case 'no-conversion':
        case 'review-conversion':
          ++doubtly
          break
        case 'awaiting-conversion':
          ++dirts
          break
        case 'awaiting-download':
        case 'custom:awaiting-download':
          ++toDownload
          break
      }
    })
    if (errors) {
      status = statuses.error
      status.ammount = errors
    } else if (doubtly) {
      status = statuses.doubtly
      status.ammount = doubtly
    } else if (dirts) {
      status = statuses.dirty
      status.ammount = dirts
    } else {
      status = statuses.synced
      status.ammount = toDownload
    }

    status.trackChanges = (playlist.tracks.added && playlist.tracks.added.length) || 0 + (playlist.tracks.removed && playlist.tracks.removed.length) || 0
    status.baseState = 'synced'

    return status
  },
  sort (a, b) {
    const aOrd = a.status.sortOrder
    const bOrd = b.status.sortOrder

    if (!aOrd || !bOrd) return

    if (aOrd === bOrd) {
      if (a.status.trackChanges || b.status.trackChanges) return b.status.trackChanges - a.status.trackChanges
      return b.status.ammount - a.status.ammount
    }
    return aOrd - bOrd
  }
}

const statuses = {
  get unsynced () {
    return {
      slug: 'unsynced',
      msg: 'click to sync',
      color: 'var(--button-purple)'
    }
  },
  get paused () {
    return {
      slug: 'paused',
      msg: 'Paused',
      sortOrder: 100,
      color: 'var(--global-grey)',
      baseState: 'synced'
    }
  },
  get synced () {
    return {
      slug: 'synced',
      ammount: 0,
      sortOrder: 3,
      color: 'var(--green-accept)',
      get msg () {
        return !this.ammount ? 'Synced' : this.ammount + ' to download'
      }
    }
  },
  get doubtly () {
    return {
      slug: 'doubtly',
      ammount: 0,
      sortOrder: 1,
      color: 'var(--orange-warning)',
      get msg () {
        return this.ammount + ' track' + (this.ammount === 1 ? '' : 's') + ' to review'
      }
    }
  },
  get dirty () {
    return {
      slug: 'dirty',
      ammount: 0,
      sortOrder: 2,
      color: 'var(--button-purple)',
      get msg () {
        return this.ammount + ' track' + (this.ammount === 1 ? '' : 's') + ' to convert'
      }
    }
  },
  get error () {
    return {
      slug: 'error',
      ammount: 0,
      sortOrder: 1,
      color: 'var(--red-cancel)',
      get msg () {
        return this.ammount + ' conversion error' + (this.ammount === 1 ? '' : 's')
      }
    }
  }
}

// const Strings = {
//   'paused': 'paused',
//   'error': 'conversion error',
//   'awaiting-conversion': 'awaiting conversion',
//   'downloaded': 'downloaded',
//   'custom-selection': 'paused',
//   'awaiting-download': 'awaiting download',
//   'custom:awaiting-download': 'awaiting download | custom',
//   'review-conversion': 'review conversion',
//   'no-conversion': 'no conversion found'
// }

export default PlaylistController
