import customGetters from '../../Store/Helpers/customGetters'
import * as chokidar from 'chokidar'
import { FSWatcher } from 'chokidar'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import UserMethods from './UserMethods'
import REGEX from '../../Global/REGEX'
import * as PATH from 'path'

import { SongbasketCustomMp3Tag, SongbasketCustomMp3TagNormalized, SongbasketCustomMp3TagsNormalized } from '../../../@types/SongBasket'
import { SpotifyTrackId } from '../../../@types/Spotify'
import { YouTubeResultId } from '../../../@types/YouTube'

type NormalizedTagMap = {
  [key in SongbasketCustomMp3TagsNormalized]?: string
}
export type TrackFileEntry = NormalizedTagMap & { playlist: string }
export enum FSWatcherEvent {
  ADD = 'add',
  CHANGE = 'change',
  UNLINK = 'unlink',
  UNLINKDIR = 'unlinkDir',
  ERROR = 'error',
  READY = 'ready',
  RAW = 'raw',
}
export enum SBWatcherEvent {
  READY = 'ready',
  ADDED = 'added',
  REMOVED = 'removed',
}

const homeFolderPath = () => global.HOME_FOLDER

let onReadyFns: (() => unknown)[] = []
let onTrackAddedFns: ((track: TrackFileEntry) => unknown)[] = []
let onTrackRemovedFns: ((track: TrackFileEntry) => unknown)[] = []

const resetFns = () => {
  onReadyFns = []
  onTrackAddedFns = []
  onTrackRemovedFns = []
}
resetFns()

const FileWatchers: {
  tracks: {
    [key: string]: NormalizedTagMap
  },
  watchers: FSWatcher[],
  createPlaylistWatchers: () => Promise<void>,
  clearAll: () => Promise<void>,
  rebuildWatchers: () => Promise<void>,
  retrieveTags: (path: string) => Promise<NormalizedTagMap>,
  retrieveTracks: () => void,
  addTrack: (path: string, params: NormalizedTagMap) => void,
  removeTrack: (path: string) => void,
  handleWatcherEvent: (event: FSWatcherEvent, args?: any) => void,
  on: (event: SBWatcherEvent, fn: (...args: any) => any) => void,
  trigger: (event: SBWatcherEvent, payload: TrackFileEntry) => void,
} = {
  tracks: {},
  watchers: [],
  async createPlaylistWatchers () {
    // TODO Create watchers anyway
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
        .on(FSWatcherEvent.ADD, (path) => this.handleWatcherEvent(FSWatcherEvent.ADD, path))
        .on(FSWatcherEvent.CHANGE, (path) => this.handleWatcherEvent(FSWatcherEvent.CHANGE, path))
        .on(FSWatcherEvent.UNLINK, (path) => this.handleWatcherEvent(FSWatcherEvent.UNLINK, path))
        .on(FSWatcherEvent.UNLINKDIR, (path) => this.handleWatcherEvent(FSWatcherEvent.UNLINKDIR, path))
        .on(FSWatcherEvent.ERROR, (error) => this.handleWatcherEvent(FSWatcherEvent.ERROR, error))
        .on(FSWatcherEvent.READY, () => this.handleWatcherEvent(FSWatcherEvent.READY))
        .on(FSWatcherEvent.RAW, (event, path, details) => this.handleWatcherEvent(FSWatcherEvent.RAW, [event, path, details]))

      // 'add', 'addDir' and 'change' events also receive stat() results as second
      // argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
      watcher.on(FSWatcherEvent.CHANGE, function (path, stats) {
        if (stats) console.log('File', path, 'changed size to', stats.size)
      })
    })
  },
  async clearAll () {
    try {
      for (const watcher of this.watchers) {
        await watcher.close()
      }
      this.watchers = []
      this.tracks = {}
      resetFns()
    } catch (error) {
      throw error
    }
  },
  async rebuildWatchers () {
    try {
      await this.clearAll()
      await this.createPlaylistWatchers()
    } catch (error) {
      throw error
    }
  },
  async retrieveTags (path) {
    const tags = await UserMethods.retrieveMP3FileTags(path)
    if (!tags.length) return {}

    const normalized: {
      [key in SongbasketCustomMp3TagsNormalized]?: string
    } = {}

    tags.forEach(tag => {
      const normalizedTagName = ((tagName) => {
        return Object.keys(SongbasketCustomMp3TagNormalized).find(key => tagName === key) as SongbasketCustomMp3TagNormalized
      })(tag.name.replace('songbasket_', ''))

      if (normalizedTagName) normalized[normalizedTagName] = tag.value
    })

    return normalized
  },
  retrieveTracks () {
    const tracksFormatted: {
      [key: SpotifyTrackId]: {
        [key: YouTubeResultId]: {
          playlists: string[]
        }
      }
    } = {}

    for (const key in this.tracks) {
      if (!this.tracks[key]) continue // TODO Remove this (tracks should be deleted and not be null)
      const { spotify_id, youtube_id } = this.tracks[key]

      if (spotify_id && youtube_id) {
        if (!tracksFormatted[spotify_id]) tracksFormatted[spotify_id] = {}
        if (!tracksFormatted[spotify_id][youtube_id]) tracksFormatted[spotify_id][youtube_id] = { playlists: [] }

        tracksFormatted[spotify_id][youtube_id].playlists.push(getNameFromPath(key))
      }
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

    this.trigger(SBWatcherEvent.ADDED, { playlist: getNameFromPath(path), spotify_id, youtube_id })
  },
  removeTrack (path) {
    const trackToDelete = this.tracks[path]
    if (trackToDelete) {
      const playlist = getNameFromPath(path)
      const track: TrackFileEntry = {
        ...trackToDelete,
        playlist
      }
      delete this.tracks[path]
      this.trigger(SBWatcherEvent.REMOVED, track)
    }
  },

  async handleWatcherEvent (event, args) {
    if (event === FSWatcherEvent.RAW) {

    } else if (event === FSWatcherEvent.READY) {
      // READY--
      // this.trigger('ready', this.tracks)
    } else {
      const path = args
      if (!path || !isValidAudioPath(path)) return
      switch (event) {
        case FSWatcherEvent.ADD:
          const tags = await this.retrieveTags(path)
          if (Object.keys(tags).length) this.addTrack(path, tags)
          break
        case FSWatcherEvent.UNLINK:
          this.removeTrack(path)
          break
        case FSWatcherEvent.CHANGE:
        case FSWatcherEvent.UNLINKDIR:
          break
        case FSWatcherEvent.ERROR:
          console.error(args)
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

const isValidAudioPath = (path: string) => (REGEX.mp3File.test(path))

const getNameFromPath = (path: string) => {
  path = PATH.dirname(path)
  return path.substring(path.lastIndexOf('/') + 1)
}

const giveMeStack = (event: SBWatcherEvent): typeof onTrackAddedFns | typeof onTrackAddedFns | typeof onReadyFns | null => {
  switch (event) {
    case SBWatcherEvent.READY:
      return onReadyFns
    case SBWatcherEvent.ADDED:
      return onTrackAddedFns
    case SBWatcherEvent.REMOVED:
      return onTrackRemovedFns
    default:
      return null
  }
}

export default FileWatchers
