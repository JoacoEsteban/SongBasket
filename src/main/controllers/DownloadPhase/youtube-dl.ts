import * as fs from 'fs'
import * as PATH from 'path'
import * as youtubedl from 'youtube-dl'

import { extractMp3, applyTags } from './FfmpegController'
import customGetters from '../../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import ipc from '../InitializationAndHandlers/ipc.controller'

import { downloadLinkRemove, QueryTrack } from './StoredTracksChecker'
import { SongBasketTrackConversionSelection, SongBasketTrackFile } from '../../../@types/SongBasket'
import { SpotifyPlaylistId, SpotifyTrack } from '../../../@types/Spotify'

export enum DownloadStatus {
  Awaiting = 'awaiting',
  Downloading = 'downloading',
  DownloadError = 'download_error',
  DownloadEnd = 'download_end',
  Extracting = 'extracting',
  ExtractionError = 'extraction_error',
  ExtractionEnd = 'extraction_end',
  Tags = 'tags',
  TagsError = 'tags_error',
  TagsEnd = 'tags_end',
}

enum LifeCycle {
  Start = 'start',
  Progress = 'progress',
  Error = 'error',
  End = 'end',
}

type DownloadEvent = {
  type: LifeCycle,
  id: string,
  ptg?: number,
}

type RendererDownloadEvent = DownloadEvent & {
  type: string,
}

type DownloaderInstance = {
  info: {
    size: number,
    currentSize: number,
  },
  downloader: youtubedl.Youtubedl | null,
  downloadVideo: () => Promise<void>,
}

type ExtractorInstance = {
  converter: {
    convert: () => Promise<void>,
    move: () => Promise<void>,
  }
}

type DownloadInstance = {
  id: string,
  downloadFormat: string, // TODO make this an enum of webm/mp4
  info: {
    download: {
      ptg: number,
      finished: boolean,
      error: Error | null,
      size: number,
      currentSize: number
    },
    extraction: {
      ptg: number,
      finished: boolean,
      error: Error | null,
    },
    tags: {
      finished: boolean,
      error: Error | null,
    },
    currentStatus: DownloadStatus,
    ptg: number,
    finished: boolean,
  },
  yt: string,
  data: SpotifyTrack,
  playlists: {
    id: SpotifyPlaylistId,
    folderName: string | null,
  }[],
  paths: {
    downloadCWD: string,
    mp4FilePath: string,
    mp3FilePath: string,
    mp3FilePathFinal: string,
    mp3FilePathFinalAlt: string,
    fileName: string,
    fileNameAlt: string,
  },
  controller: {
    setFormat: () => Promise<void>,
    constructDownload: () => void,
    constructExtraction: () => void,
    execute: () => Promise<void>
  },
  download: DownloaderInstance | null,
  extraction: ExtractorInstance | null,
}

const tempDownloadsFolderPath = () => PATH.join(global.CONSTANTS.APP_SUPPORT_PATH, 'temp', 'downloads')

const emitEvent = {
  send: ipc.send,
  lastEvent: null as RendererDownloadEvent | null,
  timeoutInProgress: false,
  makeTimeout: (params: DownloadEvent, key: string) => {
    emitEvent.lastEvent = {
      ...params,
      type: key + ':' + params.type
    } as RendererDownloadEvent

    if (emitEvent.timeoutInProgress) return
    emitEvent.timeoutInProgress = true
    setTimeout(() => {
      emitEvent.send('DOWNLOAD:EVENT', emitEvent.lastEvent)
      emitEvent.timeoutInProgress = false
    }, 300)
  },
  downloadStarted: (tracks: DownloadInstance[]) => {
    emitEvent.send('DOWNLOAD:START', tracks.map(({ id, info }) => ({ id, info })))
  },
  downloadFinished: () => {
    emitEvent.send('DOWNLOAD:END')
  },
  download: (params: DownloadEvent) => {
    emitEvent.makeTimeout(params, 'download')
  },
  extraction: (params: DownloadEvent) => {
    emitEvent.makeTimeout(params, 'extraction')
  },
  tags: (params: DownloadEvent) => {
    emitEvent.makeTimeout(params, 'tags')
  }
}

let ALL_TRACKS: DownloadInstance[] = []
export default {
  async onDowloadStart () {
    console.log('--------------DOWNLOAD STARTED--------------')
    ALL_TRACKS.length && emitEvent.downloadStarted(ALL_TRACKS)
  },
  async downloadSyncedPlaylists (localTracks: SongBasketTrackFile[], plFilter: SpotifyPlaylistId[]) {
    console.log('Stored tracks: ', localTracks.length)
    let tracksToDownload = customGetters.convertedTracks_SAFE()
    if (plFilter) tracksToDownload = tracksToDownload.filter(t => t.playlists.some(pl => plFilter.includes(pl.id)))
    ALL_TRACKS = constructDownloads((await downloadLinkRemove(localTracks, utils.cloneObject(tracksToDownload), plFilter)))
    this.onDowloadStart()

    let hasErrors = false
    for (const track of ALL_TRACKS) {
      try {
        await track.controller.execute()
      } catch (error) {
        if (global.CONNECTED_TO_INTERNET) {
          await global.flushYtDlCache()
          continue
        } else { hasErrors = true; break }
      }
    }

    if (hasErrors) console.error('ERRORS DURING DOWNLOAD')
    else console.log('ALL TRACKS DOWNLOADED')
    emitEvent.downloadFinished()
    ALL_TRACKS = []
  }
}

function constructDownloads (tracks: QueryTrack[]) {
  const exec = () => tracks.map(generateDownloadObject).filter(track => track)

  // CONSTRUCTOR FUNCTIONS
  const generateDownloadObject = (track: QueryTrack): DownloadInstance => {
    const { id, playlists, data, selection } = track
    const instance: DownloadInstance = {
      id,
      downloadFormat: '',
      info: {
        download: {
          ptg: 0,
          finished: false,
          error: null,
          size: 0,
          currentSize: 0
        },
        extraction: {
          ptg: 0,
          finished: false,
          error: null
        },
        tags: {
          finished: false,
          error: null
        },
        currentStatus: DownloadStatus.Awaiting,
        ptg: 0,
        finished: false
      },
      yt: (() => { // TODO centralize this logic somewhere else
        if (selection === null) return track.conversion?.bestMatch!
        if (selection === false) return track.custom?.id!
        return selection
      })(),
      data,
      playlists: playlists.map(({ id }) => ({
        id,
        folderName: customGetters.giveMePlFolderName(id)
      })),
      paths: {
        downloadCWD: '',
        mp4FilePath: '',
        mp3FilePath: '',
        mp3FilePathFinal: '',
        mp3FilePathFinalAlt: '',
        fileName: '',
        fileNameAlt: '',
      },
      controller: {
        setFormat: async () => getTrackFormat(instance),
        constructDownload: () => constructVideoDownload(instance),
        constructExtraction: () => constructVideoExtraction(instance),
        execute: async () => executeDownload(instance)
      },
      download: null,
      extraction: null
    }

    const paths = instance.paths
    const fileName = paths.fileName = utils.encodeIntoFilename(data.name) // colons turnt into hyphens & etc
    const fileNameAlt = paths.fileNameAlt = `${fileName} - ${id}`
    if (!instance.playlists.length) global.log(instance, 'passed?')
    paths.downloadCWD = PATH.join(tempDownloadsFolderPath(), instance.playlists[0].id)
    paths.mp4FilePath = PATH.join(paths.downloadCWD, id + '.songbasket_preprocessed_file')
    paths.mp3FilePath = PATH.join(paths.downloadCWD, id + '.mp3')
    if (instance.playlists[0].folderName) {
      paths.mp3FilePathFinal = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(instance.playlists[0].folderName), fileName + '.mp3')
      paths.mp3FilePathFinalAlt = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(instance.playlists[0].folderName), fileNameAlt + '.mp3')
    }

    return instance
  }

  const getTrackFormat = (track: DownloadInstance): Promise<void> => {
    // TODO evaluate going for webm again or not
    return new Promise((resolve, reject) => {
      track.downloadFormat = 'mp4'
      resolve()
      // youtubedl.exec(track.ytId, ['-F'], {}, function(err, output) {
      //   if (err) reject(err)
      //   // track.format = output.some(format => format.includes('251          webm')) ? 'webm' : 'mp4'
      //   track.format = 'mp4'
      //   resolve()
      // })
    })
  }

  const constructVideoDownload = (instance: DownloadInstance) => {
    instance.download = {
      info: {
        size: 0,
        currentSize: 0
      },
      downloader: null,
      downloadVideo: () => {
        return new Promise(async (resolve, reject) => {
          if (!instance.yt) return reject(new Error('NO TRACK SELECTION'))
          console.log('about to download', instance.yt)
          const download = instance.download!.downloader = youtubedl(instance.yt,
            ['--format=' + getDownloadFormatId(instance.downloadFormat)],
            { cwd: instance.paths.downloadCWD })

          // -------------EVENTS-------------
          // Will be called when the download starts.
          download.on('info', info => {
            instance.info.download.size = info.size
            instance.info.currentStatus = DownloadStatus.Downloading
            emitEvent.download({ type: LifeCycle.Start, id: instance.id })
          })

          download.on('data', chunk => {
            instance.info.download.currentSize += chunk.length
            const ptg = Math.round(instance.info.download.currentSize / instance.info.download.size * 100)
            instance.info.ptg = instance.info.download.ptg = ptg
            emitEvent.download({ type: LifeCycle.Progress, id: instance.id, ptg })
          })

          download.on('error', (error) => {
            console.error('Error when downloading video::::', error)
            instance.info.download.error = error
            instance.info.currentStatus = DownloadStatus.DownloadError
            emitEvent.download({ type: LifeCycle.Error, id: instance.id })
            return reject(error)
          })

          download.on('end', async () => {
            instance.info.download.finished = true
            if (instance.info.download.error) return
            instance.info.download.ptg = 100
            instance.info.currentStatus = DownloadStatus.DownloadEnd
            console.log('video downloaded')
            emitEvent.download({ type: LifeCycle.End, id: instance.id })
            return resolve()
          })

          download.pipe(fs.createWriteStream(instance.paths.mp4FilePath))
        })
      }
    }
  }

  const constructVideoExtraction = (instance: DownloadInstance) => {
    instance.extraction = {
      converter: {
        convert: async () => {
          try {
            instance.info.currentStatus = DownloadStatus.Extracting
            emitEvent.extraction({ type: LifeCycle.Start, id: instance.id })
            instance.info.ptg = 0
            await extractMp3(instance.paths.mp3FilePath, instance.paths.mp4FilePath, instance.downloadFormat, progress => {
              const ptg = Math.round(progress.percent)
              instance.info.ptg = instance.info.extraction.ptg = ptg
              emitEvent.extraction({ type: LifeCycle.Progress, id: instance.id, ptg })
            })
          } catch (err) {
            if (err instanceof Error) instance.info.extraction.error = err
            instance.info.currentStatus = DownloadStatus.ExtractionError
            emitEvent.extraction({ type: LifeCycle.Error, id: instance.id })
            throw err
          } finally {
            instance.info.extraction.finished = true
            !instance.info.extraction.error && (instance.info.extraction.ptg = 100) + (instance.info.currentStatus = DownloadStatus.ExtractionEnd)
            emitEvent.extraction({ type: LifeCycle.End, id: instance.id })
          }

          try {
            instance.info.currentStatus = DownloadStatus.Tags
            emitEvent.tags({ type: LifeCycle.Start, id: instance.id })
            await applyTags(instance.paths.mp3FilePath, instance.data, instance.yt)
            console.log('finished tags')
            emitEvent.tags({ type: LifeCycle.End, id: instance.id })
          } catch (err) {
            if (err instanceof Error) instance.info.tags.error = err
            instance.info.currentStatus = DownloadStatus.TagsError
            emitEvent.tags({ type: LifeCycle.Error, id: instance.id })
            throw err
          } finally {
            !instance.info.tags.error && (instance.info.currentStatus = DownloadStatus.TagsEnd)
            instance.info.tags.finished = true
            instance.info.finished = true
          }
        },
        move: async () => {
          let moveFunction = utils.copyNRemove
          if (await utils.pathDoesExist(instance.paths.mp3FilePathFinal)) instance.paths.mp3FilePathFinal = instance.paths.mp3FilePathFinalAlt
          if (utils.isSameDisk(instance.paths.mp3FilePath, instance.paths.mp3FilePathFinal)) moveFunction = utils.linkNRemove

          await moveFunction(instance.paths.mp3FilePath, instance.paths.mp3FilePathFinal)
        }
      }
    }
  }

  const executeDownload = async (instance: DownloadInstance) => {
    if (!instance.download) throw new Error('NO DOWNLOADER')
    if (!instance.extraction) throw new Error('NO EXTRACTOR')

    await instance.controller.setFormat()
    instance.controller.constructDownload()
    instance.controller.constructExtraction()

    try {
      await utils.createDirRecursive(instance.paths.downloadCWD)
    } catch (err) {
      console.error('ERROR CREATING TEMP DOWNLOAD PATH')
      throw err
    }

    try {
      await instance.download.downloadVideo()
    } catch (err) {
      console.error('ERROR DOWNLOADING VIDEO', err)
      throw err
    }

    try {
      await instance.extraction.converter.convert()
      console.log('finished extraction')
    } catch (error) {
      console.error('ERROR EXTRACTING AUDIO')
      throw error
    }

    try {
      await instance.extraction.converter.move()
      console.log('track moved')
    } catch (error) {
      console.error('ERROR MOVING TRACK')
      throw error
    }

    if (instance.playlists.length === 1) return

    instance.playlists.forEach(async pl => { // TODO: make this async
      if (!pl.folderName) throw new Error('NO FOLDER NAME')
      const folderPath = PATH.join(global.HOME_FOLDER, pl.folderName)

      let fullPath = PATH.join(folderPath, instance.paths.fileName + '.mp3')
      if (await utils.pathDoesExist(fullPath)) fullPath = PATH.join(folderPath, instance.paths.fileNameAlt + '.mp3')
      try {
        await utils.link(instance.paths.mp3FilePathFinal, fullPath)
      } catch (err) {
        console.error('ERROR LINKING TRACK TO OTHER PLAYLISTS')
        throw err
      }
    })
  }

  return exec()
}

function getDownloadFormatId (format: string) {
  switch (format) {
    case 'webm':
      return '251'
    case 'mp4':
      return '18'
  }
}
