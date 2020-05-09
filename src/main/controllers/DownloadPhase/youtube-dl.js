import fs from 'fs'
import PATH from 'path'
import youtubedl from 'youtube-dl'

import {extractMp3, applyTags} from './FfmpegController'
import customGetters from '../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import ipc from '../InitializationAndHandlers/ipc.controller'

import {downloadLinkRemove} from './StoredTracksChecker'

const tempDownloadsFolderPath = () => PATH.join(global.CONSTANTS.APP_CWD, 'temp', 'downloads')

const emitEvent = {
  send: ipc.send,
  lastEvent: null,
  timeoutInProgress: false,
  makeTimeout: (params, key) => {
    params.type = key + ':' + params.type
    emitEvent.lastEvent = params

    if (emitEvent.timeoutInProgress) return
    emitEvent.timeoutInProgress = true
    setTimeout(() => {
      emitEvent.send('DOWNLOAD:EVENT', emitEvent.lastEvent)
      emitEvent.timeoutInProgress = false
    }, 300)
  },
  downloadStarted: (tracks) => {
    emitEvent.send('DOWNLOAD:START', tracks.map(({id, info}) => ({id, info})))
  },
  downloadFinished: (tracks) => {
    emitEvent.send('DOWNLOAD:END')
  },
  download: (params) => {
    emitEvent.makeTimeout(params, 'download')
  },
  extraction: (params) => {
    emitEvent.makeTimeout(params, 'extraction')
  },
  tags: (params) => {
    emitEvent.makeTimeout(params, 'tags')
  }
}

let ALL_TRACKS
export default {
  async onDowloadStart () {
    console.log('--------------DOWNLOAD STARTED--------------')
    ALL_TRACKS && emitEvent.downloadStarted(ALL_TRACKS)
  },
  async downloadSyncedPlaylists (localTracks, plFilter) {
    console.log('Stored tracks: ', localTracks.length)
    let tracksToDownload = customGetters.convertedTracks()
    if (plFilter) tracksToDownload = tracksToDownload.filter(t => t.playlists.some(pl => plFilter.includes(pl.id)))
    ALL_TRACKS = constructDownloads((await downloadLinkRemove(localTracks, utils.cloneObject(tracksToDownload), plFilter)).filter(track => (track.conversion.yt.length || track.custom) && track.playlists.length)) // TODO Prevent this filter from ever happening
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
    ALL_TRACKS = null
  }
}

function constructDownloads (tracks) {
  const exec = () => tracks.map(generateDownloadObject).filter(track => track)

  // CONSTRUCTOR FUNCTIONS
  const generateDownloadObject = (track) => {
    /*
      {
        id: spid,
        yt: ytid,
        playlists: [
          {
            id: plid,
            folderName: ''
          }
        ],
        paths: {
          downloadCWD: '',
          mp4FilePath: '',
          mp3FilePath: '',
          mp3FilePathFinal: '',
          mp3FilePathFinalAlt: '',
        },
        controller: {
          getFormat: () => {},
          constructDownload: () => {},
          constructExtraction: () => {},
          endCallback: () => {},
        },
        info: {
          download: {
            ptg: 0,
            finished: false,
            error: null
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
          currentStatus: 'awaiting',
          finished: false
        }
      }
    */
    const {id, playlists, data, selection} = track
    const instance = {
      id,
      info: {
        download: {
          ptg: 0,
          finished: false,
          error: null,
          size: null,
          currentSize: null
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
        currentStatus: 'awaiting',
        ptg: 0,
        finished: false
      },
      yt: selection,
      data,
      playlists: playlists.map(({id}) => ({
        id,
        folderName: customGetters.giveMePlFolderName(id)
      }))
    }
    const paths = instance.paths = {}
    const fileName = paths.fileName = utils.encodeIntoFilename(data.name) // colons turnt into hyphens & etc
    const fileNameAlt = paths.fileNameAlt = `${fileName} - ${id}`
    if (!instance.playlists.length) global.log(instance, 'passed?')
    paths.downloadCWD = PATH.join(tempDownloadsFolderPath(), instance.playlists[0].id)
    paths.mp4FilePath = PATH.join(paths.downloadCWD, id + '.songbasket_preprocessed_file')
    paths.mp3FilePath = PATH.join(paths.downloadCWD, id + '.mp3')
    paths.mp3FilePathFinal = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(instance.playlists[0].folderName), fileName + '.mp3')
    paths.mp3FilePathFinalAlt = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(instance.playlists[0].folderName), fileNameAlt + '.mp3')

    instance.controller = {
      getFormat: async () => getTrackFormat(instance),
      constructDownload: () => constructVideoDownload(instance),
      constructExtraction: () => constructVideoExtraction(instance),
      execute: () => executeDownload(instance)
    }

    return instance
  }

  const getTrackFormat = (track) => {
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

  const constructVideoDownload = (instance) => {
    instance.download = {
      info: {
        size: null,
        currentSize: 0
      },
      downloader: null,
      downloadVideo: () => {
        return new Promise(async (resolve, reject) => {
          if (!instance.yt) return reject(new Error('NO TRACK SELECTION'))
          console.log('about to download', instance.yt)
          const download = instance.download.downloader = youtubedl(instance.yt,
            ['--format=' + getDownloadFormatId(instance.downloadFormat)],
            { cwd: instance.paths.downloadCWD })

          // -------------EVENTS-------------
          // Will be called when the download starts.
          download.on('info', info => {
            instance.info.download.size = info.size
            instance.info.currentStatus = 'downloading'
            emitEvent.download({type: 'start', id: instance.id})
          })

          download.on('data', chunk => {
            instance.info.download.currentSize += chunk.length
            const ptg = Math.round(instance.info.download.currentSize / instance.info.download.size * 100)
            instance.info.ptg = instance.info.download.ptg = ptg
            emitEvent.download({type: 'progress', id: instance.id, ptg})
          })

          download.on('error', (error) => {
            console.error('Error when downloading video::::', error)
            instance.info.download.error = error
            instance.info.currentStatus = 'download_error'
            emitEvent.download({type: 'error', id: instance.id})
            return reject(error)
          })

          download.on('end', async () => {
            instance.info.download.finished = true
            if (instance.info.download.error) return
            instance.info.download.ptg = 100
            instance.info.currentStatus = 'download_end'
            console.log('video downloaded')
            emitEvent.download({type: 'end', id: instance.id})
            return resolve()
          })

          download.pipe(fs.createWriteStream(instance.paths.mp4FilePath))
        })
      }
    }
  }

  const constructVideoExtraction = (instance) => {
    instance.extraction = {
      info: {

      },
      converter: {
        convert: async () => {
          try {
            instance.info.currentStatus = 'extracting'
            emitEvent.extraction({type: 'start', id: instance.id})
            instance.info.ptg = 0
            await extractMp3(instance.paths.mp3FilePath, instance.paths.mp4FilePath, instance.downloadFormat, progress => {
              const ptg = Math.round(progress.percent)
              instance.info.ptg = instance.info.extraction.ptg = ptg
              emitEvent.extraction({type: 'progress', id: instance.id, ptg})
            })
          } catch (err) {
            instance.info.extraction.error = err
            instance.info.currentStatus = 'extraction_error'
            emitEvent.extraction({type: 'error', id: instance.id})
            throw err
          } finally {
            instance.info.extraction.finished = true
            !instance.info.extraction.error && (instance.info.extraction.ptg = 100) + (instance.info.currentStatus = 'extraction_end')
            emitEvent.extraction({type: 'end', id: instance.id})
          }

          try {
            instance.info.currentStatus = 'tags'
            emitEvent.tags({type: 'start', id: instance.id})
            await applyTags(instance.paths.mp3FilePath, instance.data, instance.yt)
            console.log('finished tags')
            emitEvent.tags({type: 'end', id: instance.id})
          } catch (err) {
            instance.info.tags.error = err
            instance.info.currentStatus = 'tags_error'
            emitEvent.tags({type: 'error', id: instance.id})
            throw err
          } finally {
            !instance.info.tags.error && (instance.info.currentStatus = 'tags_end')
            instance.info.tags.finished = true
            instance.info.finished = true
          }
        },
        move: async () => {
          let moveFunction = utils.copyNRemove
          if (await utils.pathDoesExist(instance.paths.mp3FilePathFinal)) instance.paths.mp3FilePathFinal = instance.paths.mp3FilePathFinalAlt
          if (utils.isSameDisk(instance.paths.mp3FilePath, instance.paths.mp3FilePathFinal)) moveFunction = utils.linkNRemove
          try {
            await moveFunction(instance.paths.mp3FilePath, instance.paths.mp3FilePathFinal)
          } catch (err) {
            throw err
          }
        }
      }
    }
  }

  const executeDownload = async instance => {
    await instance.controller.getFormat()
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

    instance.playlists.forEach(async pl => {
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

function getDownloadFormatId (format) {
  switch (format) {
    case 'webm':
      return '251'
    case 'mp4':
      return '18'
  }
}
