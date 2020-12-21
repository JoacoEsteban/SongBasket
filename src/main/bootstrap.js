import * as handlers from './controllers/InitializationAndHandlers/handlers'
import * as utils from '../MAIN_PROCESS_UTILS'

// ---------------------ffmepeg---------------------
(async function botstrapFfmpeg () {
  const ffmpeg = require('fluent-ffmpeg')
  const ffbinaries = require('ffbinaries')
  const binPath = global.CONSTANTS.FFMPEG_BINARIES_PATH

  await utils.createDirRecursive(binPath)
  ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], { destination: binPath }, () => {
    global.CONSTANTS.FFMPEG_BINS_DOWNLOADED = true
    handlers.onFfmpegBinaries()
    ffmpeg.setFfmpegPath(binPath + '/ffmpeg')
    ffmpeg.setFfprobePath(binPath + '/ffprobe')
  })
})();

// ---------------------youtube-dl---------------------
(function botstrapYoutubeDl () {
  const child_process = require('child_process')
  const youtubeDl = require('youtube-dl')
  global.CONSTANTS.ENV_PROD && youtubeDl.setYtdlBinary(youtubeDl.getYtdlBinary().replace('app.asar', 'app.asar.unpacked'))

  global.flushYtDlCache = async () => {
    return new Promise((resolve, reject) => {
      child_process.exec(youtubeDl.getYtdlBinary() + ' --rm-cache-dir', (err, out) => {
        if (err) {
          console.error('Error flushding ytdl cache', err)
          return reject(err)
        }
        resolve(out)
      })
    })
  }

  global.flushYtDlCache().catch(global.emptyFn)
})()
