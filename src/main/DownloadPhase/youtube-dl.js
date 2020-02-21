import {extractMp3, applyTags} from './FfmpegController'
import store from '../../renderer/store'
import customGetters from '../../renderer/store/customGetters'
import * as utils from '../../MAIN_PROCESS_UTILS'
import GLOBAL from '../Global/VARIABLES'
import {downloadLinkRemove, link} from './StoredTracksChecker'

const fs = require('fs')
const PATH = require('path')
const youtubedl = require('youtube-dl')
const tempDownloadsFolderPath = GLOBAL.APP_CWD + '/downloads_temp/'

const emitEvent = {
  download: (params) => {
    store.dispatch('downloadEvent', params)
  },
  conversion: (params) => {
    store.dispatch('conversionEvent', params)
  }
}

export default {
  downloadSyncedPlaylists (localTracks) {
    console.log('Stored tracks: ', localTracks.length)
    let allTracks = downloadLinkRemove(localTracks, utils.cloneObject(store.state.CurrentUser.convertedTracks))

    constructDownloads(allTracks)

    const downloadTrack = async (index, index2) => {
      if (!allTracks[index]) return console.log('ALL TRACKS DOWNLOADED')
      let track = allTracks[index].trackMap[Object.keys(allTracks[index].trackMap)[index2]]
      if (track) {
        await initializeTrack(track)
        try {
          await track.download.startDownload()
        } catch (error) {
          // TODO Handle error
          throw error
        }
        downloadTrack(index, index2 + 1)
      } else downloadTrack(index + 1, 0)
    }

    const initializeTrack = async (track) => {
      await track.getFormat()
      track.constructDownload()
      track.constructConversion()
    }

    downloadTrack(0, 0)
  }
}

function constructDownloads (tracks) {
  const exec = () => {
    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i]
      if (track.conversion === null) {
        track = null
        continue
      }

      if (!createTrackMap(track)) {
        track = null
        continue
      }

      // Undownloadable tracks filtered & trackMap created
    }

    tracks = tracks.filter(track => !!track)
  }

  // CONSTRUCTOR FUNCTIONS
  const createTrackMap = (track) => {
    let trackMap = (track.trackMap = {})
    track.trackName = utils.encodeIntoFilename(track.data.name) // colons turnt into hyphens at the filename
    track.playlists.forEach(pl => {
      let yt = pl.selected === null ? track.conversion.bestMatch : pl.selected === false ? track.custom.id : pl.selected
      if (!trackMap[yt]) trackMap[yt] = {spId: track.data.id, ytId: yt, playlists: []}
      const currentTrackVersion = trackMap[yt]
      currentTrackVersion.playlists.push({ id: pl.id, name: customGetters.giveMePlName(pl.id) })

      if (!currentTrackVersion.paths) {
        let fullPath = tempDownloadsFolderPath + utils.encodeIntoFilename(trackMap[yt].playlists[0].name)
        currentTrackVersion.paths = {
          fullPath,
          fullPathmp4: PATH.join(fullPath, track.trackName + '.songbasket_preprocessed_file'),
          fullPathmp3: PATH.join(fullPath, track.trackName + '.mp3'),
          finalPathmp3: PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(trackMap[yt].playlists[0].name), track.trackName + '.mp3')
        }

        currentTrackVersion.getFormat = async () => getTrackFormat(currentTrackVersion)
        currentTrackVersion.constructDownload = () => constructVideoDownload(currentTrackVersion)
        currentTrackVersion.constructConversion = () => constructVideoConversion(currentTrackVersion, track.data)

        currentTrackVersion.endCallback = () => {
          if (currentTrackVersion.playlists.length > 1) {
            currentTrackVersion.playlists.forEach(pl => {
              link(PATH.join(currentTrackVersion.paths.fullPathmp3, global.HOME_FOLDER, utils.encodeIntoFilename(pl.name), track.trackName))
            })
          }
        }
      }
    })
    return Object.keys(trackMap).length ? trackMap : null
  }

  const getTrackFormat = (track) => {
    // TODO evaluate going for webm again or not
    return new Promise((resolve, reject) => {
      track.format = 'mp4'
      resolve()
      // youtubedl.exec(track.ytId, ['-F'], {}, function(err, output) {
      //   if (err) reject(err)
      //   // track.format = output.some(format => format.includes('251          webm')) ? 'webm' : 'mp4'
      //   track.format = 'mp4'
      //   resolve()
      // })
    })
  }

  const constructVideoDownload = (track) => {
    track.download = {
      info: {
        downloadStarted: false,
        downloadFinished: false,
        downloadError: null,
        size: null,
        currentSize: 0
      },
      downloader: null,
      startDownload: () => {
        return new Promise(async (resolve, reject) => {
          console.log('about to download', track.ytId)
          track.download.downloader = youtubedl(track.ytId,
            ['--format=' + getDownloadFormatId(track.format)],
            { cwd: track.paths.fullPath })

          let download = track.download.downloader

          // Will be called when the download starts.
          download.on('info', function (info) {
            console.log('Download started')
            console.log('filename: ' + info._filename)
            console.log('size: ' + info.size)
            track.download.info.size = info.size
            track.download.info.downloadStarted = true
            emitEvent.download({type: 'start', track})
          })

          download.on('data', (chunk) => {
            track.download.info.currentSize += chunk.length
            // console.log(Math.round(track.download.info.currentSize / track.download.info.size * 100) + '%')
            emitEvent.download({type: 'chunk', track})
          })

          download.on('error', (error) => {
            // TODO HANDLE ERROR AND STOP ROUTINE
            console.error('Error when downloading video::::', error)
            track.download.info.downloadError = error
            emitEvent.download({type: 'error', track})
            reject(error)
          })

          download.on('end', async () => {
            if (track.download.info.downloadError) return
            console.log('track downloaded')
            emitEvent.download({type: 'end', track})
            try {
              await track.conversion.converter.convert()
              console.log('finished conversion')
            } catch (error) {
              // TODO Handle error
              throw error
            }

            try {
              await track.conversion.converter.move()
              console.log('track moved')
            } catch (error) {
              // TODO Handle error
              throw error
            }

            track.endCallback()
            resolve()
          })

          try {
            await utils.createDirRecursive(track.paths.fullPath)
          } catch (err) {
            // TODO Handle error when creating tmp download dir
            throw err
          }

          download.pipe(fs.createWriteStream(track.paths.fullPathmp4))
        })
      }
    }
  }

  const constructVideoConversion = (track, spotifyData) => {
    track.conversion = {
      info: {

      },
      converter: {
        convert: async () => {
          try {
            emitEvent.conversion({type: 'extraction-start', track})
            await extractMp3(track.paths.fullPathmp3, track.paths.fullPathmp4, track.format)
          } catch (err) {
            emitEvent.conversion({type: 'extraction-error', track})
            throw err
          }
          emitEvent.conversion({type: 'extraction-end', track})

          try {
            emitEvent.conversion({type: 'tags-start', track})
            await applyTags(track.paths.fullPathmp3, spotifyData, track.ytId)
            console.log('finished tags')
          } catch (err) {
            emitEvent.conversion({type: 'tags-error', track})
            throw err
          }
          emitEvent.conversion({type: 'tags-end', track})
        },
        move: async () => {
          // let moveFunction = utils.copyNRemove
          let moveFunction = utils.copyNRemove
          if (utils.isSameDisk(track.paths.fullPathmp3, track.paths.finalPathmp3)) moveFunction = utils.linkNRemove
          try {
            await moveFunction(track.paths.fullPathmp3, track.paths.finalPathmp3)
          } catch (err) {
            // TODO Handle moving error
            throw err
          }
        }
      }
    }
  }

  exec()
}

function getDownloadFormatId (format) {
  switch (format) {
    case 'webm':
      return '251'
    case 'mp4':
      return '18'
  }
}
