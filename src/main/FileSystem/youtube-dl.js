import store from '../../renderer/store'
import customGetters from '../../renderer/store/customGetters'

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
  downloadSyncedPlaylists (playlists) {
    console.log('STARTING DOWNLOAD')
    let ytPlaylists = store.state.CurrentUser.syncedPlaylists
    let spPlaylists = customGetters.SyncedPlaylistsSp()
    // TODO Filter already downloaded tracks

    downloadLoop(0, 0)

    function downloadLoop (playlistIndex, trackIndex) {
      if (playlistIndex < spPlaylists.length) {
        let sp = spPlaylists[playlistIndex]
        if (trackIndex >= sp.tracks.items.length) downloadLoop(playlistIndex + 1, 0)
        else {
          // TODO turn find into for => splice
          let yt = ytPlaylists.find(yt => yt.id === sp.id)

          let spTrack = sp.tracks.items[trackIndex]
          let ytTrack = yt.tracks.find(track => track.id === spTrack.id)

          let {name, id} = spTrack
          let fullPath = process.env.HOME_FOLDER + '/' + sp.name
          let fullPathmp4 = fullPath + '/' + name + '.mp4'
          let fullPathmp3 = fullPath + '/' + name + '.mp3'

          console.log('downloading ', fullPathmp4)
          let video = youtubedl(ytTrack.selected,
            // Optional arguments passed to youtube-dl.
            ['--format=18'],
            // Additional options can be given for calling `child_process.execFile()`.
            { cwd: fullPath })

          // Will be called when the download starts.
          let size = 0
          video.on('info', function (info) {
            console.log('Download started')
            console.log('filename: ' + info._filename)
            console.log('size: ' + info.size)
            size = info.size
          })

          video.pipe(fs.createWriteStream(fullPathmp4))

          let current = 0
          video.on('data', (chunk) => {
            current += chunk.length
            // console.log(Math.round(current / size * 100) + '%')
            store.dispatch('downloadChunk', {id, current, size})
          })

          video.on('end', () => {
            console.log('track completed')
            store.dispatch('downloadChunk', {id, finished: true})
            downloadLoop(playlistIndex, trackIndex + 1)
            convertMp3(fullPathmp3, fullPathmp4, spTrack, ytTrack.selected)
          })
        }
      }
    }

    function convertMp3 (pathmp3, pathmp4, track, ytSelection) {
      return new Promise(() => {
        let command =
          ffmpeg(pathmp4)
            .inputFormat('mp4')
            .on('end', () => {
              // TODO Emit convertion starting
              // TODO Delete MP4
              console.log('Finished processing')
              applyTags(pathmp3, track, ytSelection)
            })

        command.save(pathmp3)
      })
    }

    function applyTags (pathmp3, track, ytSelection) {
      // TODO Emit applying tags
      console.log('applying tags')
      getPhoto(track.album.images[0].url)
        .then(buffer => {
          let tags = {
            title: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            userDefinedText: [{
              description: 'songbasket_spotify_id',
              value: track.id
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

          // TODO Emit Track Finished
          let tagSuccess = NodeID3.write(tags, pathmp3)
          if (!tagSuccess) {
            // TODO Handle error
          } else {

          }
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
  }
}
