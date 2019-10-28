import store from '../../renderer/store'
import customGetters from '../../renderer/store/customGetters'
import * as utils from '../../MAIN_PROCESS_UTILS'

let NodeID3 = require('node-id3')
let axios = require('axios')
let fs = require('fs')

let youtubedl = require('youtube-dl')
let ffbinaries = require('ffbinaries')
let ffmpeg = require('fluent-ffmpeg')

let binPath = process.cwd() + '/bin/ffmpeg'
ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {destination: binPath}, function () {
  console.log('Downloaded all binaries for current platform.')

  ffmpeg.setFfmpegPath(binPath + '/ffmpeg')
  ffmpeg.setFfprobePath(binPath + '/ffprobe')
})

export default {
  downloadSyncedPlaylists (localTracks) {
    console.log('Stored tracks: ', localTracks.length)
    // TODO Filter already downloaded tracks
    let allTracks = downloadLinkRemove(localTracks, utils.cloneObject(store.state.CurrentUser.convertedTracks))
    console.log('Filtered tracks: ', allTracks.length)
    downloadLoop(0)

    function downloadLoop (trackIndex) {
      if (trackIndex < allTracks.length) {
        let track = allTracks[trackIndex]
        let trackMap = {}

        track.playlists.forEach(pl => {
          let yt = pl.selected === null ? track.conversion.bestMatch : pl.selected
          trackMap[yt] = trackMap[yt] === undefined ? [pl.id] : [...trackMap[yt], pl.id]
        })

        // TODO Check this with Windows / Linux
        let name = utils.encodeIntoFilename(track.data.name) // colons turn into slashes at the filename
        let id = track.id
        if (Object.keys(trackMap).length === 0) return downloadLoop(trackIndex + 1)

        for (let ytId in trackMap) {
          let fullPath = process.env.HOME_FOLDER + '/' + utils.encodeIntoFilename(customGetters.giveMePlName(trackMap[ytId][0]))
          let fullPathmp4 = fullPath + '/' + name + '.mp4'
          let fullPathmp3 = fullPath + '/' + name + '.mp3'
          console.log('trackie: ', trackMap[ytId])

          console.log('downloading ', fullPathmp4)
          let video = youtubedl(ytId,
            // Optional arguments passed to youtube-dl.
            ['--format=18'],
            // Additional options can be given for calling `child_process.execFile()`.
            { cwd: fullPath })

          // Will be called when the download starts.
          video.on('info', function (info) {
            console.log('Download started')
            console.log('filename: ' + info._filename)
            console.log('size: ' + info.size)
            store.dispatch('downloadChunk', {started: true, id, ytId, info})
          })

          video.pipe(fs.createWriteStream(fullPathmp4))

          let current = 0
          video.on('data', (chunk) => {
            current += chunk.length
            // console.log(Math.round(current / size * 100) + '%')
            store.dispatch('downloadChunk', {id, ytId, current})
          })

          video.on('end', () => {
            console.log('track completed')
            store.dispatch('downloadChunk', {id, ytId, finished: true})
            downloadLoop(trackIndex + 1)
            convertMp3(fullPathmp3, fullPathmp4, track, ytId)
              .then(() => {
                for (let i = 1; i < trackMap[ytId].length; i++) {
                  link(fullPathmp3, process.env.HOME_FOLDER + '/' + utils.encodeIntoFilename(customGetters.giveMePlName(trackMap[ytId][i])) + '/' + name)
                }
                console.log('finished track')
              })
              .catch(() => {
                // TODO handle error
              })
          })
        }
      }
    }

    function convertMp3 (pathmp3, pathmp4, track, ytId) {
      return new Promise((resolve, reject) => {
        let command =
          ffmpeg(pathmp4)
            .inputFormat('mp4')
            .on('end', () => {
              // TODO Emit convertion starting
              fs.unlink(pathmp4)
              console.log('Finished processing')
              applyTags(pathmp3, track, ytId)
                .then(() => {
                  // TODO Emit Track Finished
                  resolve()
                })
                .catch((err) => {
                  // TODO handle error
                  reject(err)
                })
            })
        command.save(pathmp3)
      })
    }

    function applyTags (pathmp3, track, ytSelection) {
      let data = track.data
      return new Promise((resolve, reject) => {
        // TODO Emit applying tags
        console.log('applying tags')
        getPhoto(data.album.images[0].url)
          .then(buffer => {
            let tags = {
              title: data.name,
              artist: data.artists[0].name,
              album: data.album.name,
              userDefinedText: [{
                description: 'songbasket_spotify_id',
                value: data.id
              }, {
                description: 'songbasket_youtube_id',
                value: ytSelection
              }],
              image: {
                mime: 'png/jpeg' / undefined,
                type: {
                  id: 3,
                  name: 'front cover'
                },
                imageBuffer: buffer
              }
            }

            let tagSuccess = NodeID3.write(tags, pathmp3)
            if (!tagSuccess) {
              // TODO Handle error
              reject(new Error('error while writing tags'))
            } else {
              resolve()
            }
          })
      })
    }

    function getPhoto (url) {
      console.log('getting picture')
      return new Promise((resolve, reject) => {
        axios({
          url,
          method: 'GET',
          responseType: 'stream'
        }).then(resp => {
          // console.log('rep', resp)
          let buffer = Buffer.alloc(0)
          resp.data
            .on('data', (chunk) => {
              buffer = Buffer.concat([buffer, chunk])
            // console.log('bu00000', buffer)
            })
            .on('end', () => {
              console.log('photo retrieved')
              resolve(buffer)
            })
        })
          .catch((err) => reject(err))
      })
    }

    function downloadLinkRemove (localTracks, queryTracks) {
      let linkQueue = []
      let unlinkQueue = []
      for (let i = 0; i < queryTracks.length; i++) {
        let qt = queryTracks[i]
        for (let o = 0; o < localTracks.length; o++) {
          let lt = localTracks[o]
          if (qt.id === lt.songbasket_spotify_id) {
            console.log('FOUND') // same SP Track
            let found = false
            let unlinkTrack = false
            console.log('playlists', qt.playlists.length, lt.playlist)
            for (let u = 0; u < qt.playlists.length; u++) {
              let pl = qt.playlists[u]
              pl.selected = pl.selected === null ? qt.conversion.bestMatch : pl.selected

              let samePl = pl.id === lt.playlist
              let sameVer = pl.selected === lt.songbasket_youtube_id
              console.log('a ver', samePl, sameVer)
              if (samePl || sameVer) {
                found = true

                if (sameVer && samePl) {
                  qt.playlists.splice(u, 1) // Track found, skipping
                  u--
                  found = true
                } else {
                  if (!sameVer) { // Same playlist but version changed, so unlink it when everything has been verified
                    unlinkTrack = true
                  }
                  if (!samePl) { // Same version, diff pl. Hardlink into this playlist
                    console.log('LINKING EXISTING TRACK')
                    linkQueue.push({paths: [lt.path, process.env.HOME_FOLDER + '/' + utils.encodeIntoFilename(customGetters.giveMePlName(pl.id)) + '/' + lt.file], indexes: [i, u]})
                  }
                }
              }
            }
            if (found) {
              if (unlinkTrack) {
                console.log('UNLINKING TRACK')
                unlinkQueue.push(lt)
              }
              localTracks.splice(o, 1)
              o--
            }
          }
        }
      }

      linkQueue.forEach(track => {
        link(track.paths[0], track.paths[1] + '.temp')
        queryTracks[track.indexes[0]].playlists.splice(track.indexes[1], 1)
      })

      unlinkQueue = [...unlinkQueue, ...localTracks]
      unlinkQueue.forEach(track => {
        unlink(track.path)
      })

      linkQueue.forEach(track => {
        if (fs.existsSync(track.paths[1])) fs.unlinkSync(track.paths[1])
        fs.renameSync(track.paths[1] + '.temp', track.paths[1])
      })

      return queryTracks
    }
  }
}

// TODO consider both of this as async
function unlink (path) {
  if (fs.existsSync(path))fs.unlinkSync(path)
}
function link (path, newPath) {
  console.log('linking ', path, newPath)
  let exists = fs.existsSync(path) && !fs.existsSync(newPath)
  console.log(fs.existsSync(path), fs.existsSync(path))
  if (exists) fs.linkSync(path, newPath)
  return exists
}
