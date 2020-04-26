import fs from 'fs'
import PATH from 'path'
import youtubedl from 'youtube-dl'

import {extractMp3, applyTags} from './FfmpegController'
import VUEX_MAIN from '../Store/mainProcessStore'
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
    }, 200)
  },
  downloadStarted: (tracks) => {
    emitEvent.send('DOWNLOAD:START', tracks.map(t => t.id))
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

export default {
  async downloadSyncedPlaylists (localTracks, plFilter) {
    console.log('Stored tracks: ', localTracks.length)
    let tracksToDownload = VUEX_MAIN.STATE().convertedTracks
    if (plFilter) tracksToDownload = tracksToDownload.filter(t => t.playlists.some(pl => plFilter.includes(pl.id)))

    console.log('todownload', tracksToDownload)
    const allTracks = constructDownloads(await downloadLinkRemove(localTracks, utils.cloneObject(tracksToDownload), plFilter))

    emitEvent.downloadStarted(allTracks)

    let hasErrors = false
    for (const track of allTracks) {
      try {
        await track.controller.execute()
      } catch (error) {
        if (global.CONNECTED_TO_INTERNET) continue
        else { hasErrors = true; break }
      }
    }

    if (hasErrors) console.error('ERRORS DURING DOWNLOAD')
    else console.log('ALL TRACKS DOWNLOADED')
  }
}

function constructDownloads (tracks) {
  const exec = () => tracks.map(generateDownladObject).filter(track => track)

  // CONSTRUCTOR FUNCTIONS
  const generateDownladObject = (track) => {
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
        }
      }
    */
    const {id, playlists, data, selection} = track
    const instance = {
      id,
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
        downloadStarted: false,
        downloadFinished: false,
        downloadError: null,
        size: null,
        currentSize: 0
      },
      downloader: null,
      downloadVideo: () => {
        return new Promise(async (resolve, reject) => {
          console.log('about to download', instance.yt)
          const download = instance.download.downloader = youtubedl(instance.yt,
            ['--format=' + getDownloadFormatId(instance.downloadFormat)],
            { cwd: instance.paths.downloadCWD })

          // -------------EVENTS-------------
          // Will be called when the download starts.
          download.on('info', info => {
            instance.download.info.size = info.size
            instance.download.info.downloadStarted = true
            emitEvent.download({type: 'start', id: instance.id})
          })

          download.on('data', chunk => {
            instance.download.info.currentSize += chunk.length
            const ptg = Math.round(instance.download.info.currentSize / instance.download.info.size * 100)
            emitEvent.download({type: 'progress', id: instance.id, ptg})
          })

          download.on('error', (error) => {
            // TODO HANDLE ERROR AND STOP ROUTINE
            console.error('Error when downloading video::::', error)
            instance.download.info.downloadError = error
            emitEvent.download({type: 'error', id: instance.id})
            return reject(error)
          })

          download.on('end', async () => {
            if (instance.download.info.downloadError) return
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
            emitEvent.extraction({type: 'start', id: instance.id})
            await extractMp3(instance.paths.mp3FilePath, instance.paths.mp4FilePath, instance.downloadFormat, progress => {
              emitEvent.extraction({type: 'progress', id: instance.id, ptg: Math.round(progress.percent)})
            })
          } catch (err) {
            emitEvent.extraction({type: 'error', id: instance.id})
            throw err
          }
          emitEvent.extraction({type: 'end', id: instance.id})

          try {
            emitEvent.tags({type: 'start', id: instance.id})
            await applyTags(instance.paths.mp3FilePath, instance.data, instance.yt)
            console.log('finished tags')
          } catch (err) {
            emitEvent.tags({type: 'error', id: instance.id})
            throw err
          }
          emitEvent.tags({type: 'end', id: instance.id})
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
      // TODO Handle error
      console.error('ERROR CREATING TEMP DOWNLOAD PATH')
      throw err
    }

    try {
      await instance.download.downloadVideo()
    } catch (err) {
      // TODO Handle error
      console.error('ERROR DOWNLOADING VIDEO')
      throw err
    }

    try {
      await instance.extraction.converter.convert()
      console.log('finished extraction')
    } catch (error) {
      // TODO Handle error
      console.error('ERROR EXTRACTING AUDIO')
      throw error
    }

    try {
      await instance.extraction.converter.move()
      console.log('track moved')
    } catch (error) {
      // TODO Handle error
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
        // TODO Handle error
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
