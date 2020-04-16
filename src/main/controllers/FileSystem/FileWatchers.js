import customGetters from '../Store/Helpers/customGetters'
import chokidar from 'chokidar'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import UserMethods from './UserMethods'
import REGEX from '../../Global/REGEX'

const PATH = require('path')

const homeFolderPath = () => global.HOME_FOLDER

const onReadyFns = []
const onTrackAddedFns = []
const onTrackRemovedFns = []

// let READY = 0

const FileWatchers = {
  tracks: {},
  watchers: [],
  async createPlaylistWatchers () {
    if (!(await UserMethods.retrieveLocalTracks()).length) return
    let syncedPlaylists = customGetters.SyncedPlaylistsSp()
    syncedPlaylists.forEach(pl => {
      let path = homeFolderPath() + '/' + utils.encodeIntoFilename(pl.folderName || pl.name)

      // READY++

      let watcher = chokidar.watch(path, {
        ignored: /[/\\]\./
      })
      this.watchers.push(watcher)

      watcher
        .on('add', (path) => this.handleWatcherEvent('add', path))
        .on('change', (path) => this.handleWatcherEvent('change', path))
        .on('unlink', (path) => this.handleWatcherEvent('unlink', path))
        .on('unlinkDir', (path) => this.handleWatcherEvent('unlinkDir', path))
        .on('error', (error) => this.handleWatcherEvent('error', error))
        .on('ready', () => this.handleWatcherEvent('ready'))
        .on('raw', (event, path, details) => this.handleWatcherEvent('raw', [event, path, details]))

      // 'add', 'addDir' and 'change' events also receive stat() results as second
      // argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
      watcher.on('change', function (path, stats) {
        if (stats) console.log('File', path, 'changed size to', stats.size)
      })
    })
  },
  async retrieveTags (path) {
    try {
      const tags = await UserMethods.retrieveMP3FileTags(path)
      if (!tags) return null

      const normalized = {}
      tags.forEach(tag => {
        normalized[tag.name.replace('songbasket_', '')] = tag.value
      })

      return normalized
    } catch (error) {
      console.error(error)
      return null
    }
  },
  retrieveTracks () {
    const tracksFormatted = {}
    for (const key in this.tracks) {
      if (!this.tracks[key]) continue
      const { spotify_id, youtube_id } = this.tracks[key]
      if (!tracksFormatted[spotify_id]) tracksFormatted[spotify_id] = {}
      if (!tracksFormatted[spotify_id][youtube_id]) tracksFormatted[spotify_id][youtube_id] = { playlists: [] }
      tracksFormatted[spotify_id][youtube_id].playlists.push(getNameFromPath(key))
    }
    return tracksFormatted
  },
  // eslint-disable-next-line camelcase
  addTrack (path, { spotify_id, youtube_id }) {
    for (const key in this.tracks) {
      if (key === path && this.tracks[key]) return
    }

    this.tracks[path] = {
      spotify_id, youtube_id
    }

    this.trigger('added', { playlist: getNameFromPath(path), spotify_id, youtube_id })
  },
  removeTrack (path) {
    const track = { ...this.tracks[path] }
    if (track) {
      track.playlist = getNameFromPath(path)
      this.tracks[path] = undefined
      this.trigger('removed', track)
    }
  },

  async handleWatcherEvent (event, args) {
    if (event === 'raw') {

    } else if (event === 'ready') {
      // READY--
      // this.trigger('ready', this.tracks)
    } else {
      const path = args
      if (!isValidAudioPath(path)) return
      switch (event) {
        case 'add':
          let tags = await this.retrieveTags(path)
          if (tags && tags.spotify_id === '1r0BHXwfQIGczvSFlSuACX') console.log('aber')
          if (tags) this.addTrack(path, tags)
          break
        case 'unlink':
          this.removeTrack(path)
          break
        case 'change':
        case 'unlinkDir':
          break
        case 'error':
          break
      }
    }
  },

  // ------------EVENTS------------
  on (event, fn) {
    if (typeof fn !== 'function') throw new Error('Callback is not a function')
    const stack = giveMeStack(event)
    if (stack) stack.push(fn)
  },
  trigger (event, params) {
    // if (READY > 0) return
    const stack = giveMeStack(event)
    if (stack) stack.forEach(fn => fn(params))
  }
}

const isValidAudioPath = (path) => (REGEX.mp3File.test(path))

const getNameFromPath = (path) => {
  path = PATH.dirname(path)
  return path.substring(path.lastIndexOf('/') + 1)
}

const giveMeStack = (event) => {
  switch (event) {
    case 'ready':
      return onReadyFns
    case 'added':
      return onTrackAddedFns
    case 'removed':
      return onTrackRemovedFns
    default:
      return null
  }
}

export default FileWatchers
