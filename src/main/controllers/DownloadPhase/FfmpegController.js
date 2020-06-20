
import * as handlers from '../InitializationAndHandlers/handlers'
import * as utils from '../../../MAIN_PROCESS_UTILS'
const fs = require('fs')
const ffbinaries = require('ffbinaries')
const ffmpeg = require('fluent-ffmpeg')

const NodeID3 = require('node-id3')
const axios = require('axios')

const basePath = global.CONSTANTS.APP_SUPPORT_PATH
const binPath = basePath + '/bin/ffmpeg';

(async () => {
  await utils.createDirRecursive(binPath)
  ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {destination: binPath}, () => {
    global.CONSTANTS.FFMPEG_BINS_DOWNLOADED = true
    handlers.onFfmpegBinaries()
    ffmpeg.setFfmpegPath(binPath + '/ffmpeg')
    ffmpeg.setFfprobePath(binPath + '/ffprobe')
  })
})()

export function extractMp3 (pathmp3, pathmp4, inputFormat, progressCb) {
  return new Promise((resolve, reject) => {
    const command =
          ffmpeg(pathmp4)
            .inputFormat(inputFormat)
            .on('progress', progressCb)
            .on('end', async () => {
              try {
                await utils.promisify(fs.unlink, pathmp4)
              } catch (err) {
                console.error(err)
              }
              console.log('Finished processing')
              resolve()
            })
    command.save(pathmp3)
  })
}

export function applyTags (pathmp3, data, ytSelection) {
  let tags = {
    title: data.name,
    // artist: data.artists.map(a => a.name).join(';'), // TODO Try multiple artists
    artist: data.artists[0].name,
    album: data.album.name,
    userDefinedText: [{
      description: 'songbasket_spotify_id',
      value: data.id
    }, {
      description: 'songbasket_youtube_id',
      value: ytSelection
    }]
  }
  return new Promise((resolve, reject) => {
    console.log('applying tags')
    getPhoto(data.album.images[0].url)
      .then(imageBuffer => {
        tags.image = {
          mime: 'png/jpeg' / undefined,
          type: {
            id: 3,
            name: 'front cover'
          },
          imageBuffer
        }
      })
      .catch(() => console.error('Error when getting track photo, applying tracks anyway'))
      .finally(() => {
        console.log('writing tags')
        NodeID3.write(tags, pathmp3, err => {
          if (err) return reject(err)
          resolve()
        })
      })
  })
}

export function getPhoto (url) {
  console.log('getting picture')
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: 'GET',
      responseType: 'stream'
    }).then(resp => {
      let buffer = Buffer.alloc(0)
      resp.data
        .on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk])
        })
        .on('end', () => {
          console.log('photo retrieved')
          resolve(buffer)
        })
    })
      .catch((err) => reject(err))
  })
}
