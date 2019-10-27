import store from '../../renderer/store'
import customGetters from '../../renderer/store/customGetters'
import utils from '../../MAIN_PROCESS_UTILS'

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
    function skipTrack (selection, downloadedTrack) {
      if (selection !== downloadedTrack.songbasket_youtube_id) {
        fs.unlinkSync(downloadedTrack.path)
        return false
      }
      return true
    }

    console.log('STARTING DOWNLOAD', localTracks)
    let ytPlaylists = store.state.CurrentUser.syncedPlaylists
    let spPlaylists = customGetters.SyncedPlaylistsSp()
    // TODO Filter already downloaded tracks

    downloadLoop({playlistIndex: 0, ytPlaylistIndex: null, dlPlaylistIndex: null, trackIndex: 0})

    function downloadLoop ({playlistIndex, ytPlaylistIndex, dlPlaylistIndex, trackIndex}) {
      // let a = true
      // if (a) return
      if (playlistIndex < spPlaylists.length) {
        let spPlaylist = spPlaylists[playlistIndex]
        if (trackIndex >= spPlaylist.tracks.items.length) {
          // Playlist finished
          downloadLoop({playlistIndex: playlistIndex + 1, ytPlaylistIndex: null, dlPlaylistIndex: null, trackIndex: 0})
          // TODO splice ytPlaylists & dlPlaylists obj
        } else {
          // These runs the first time per playlist
          // They define where playlists objects are located, defined by
          if (ytPlaylistIndex === null) {
            for (let i = 0; i < ytPlaylists.length; i++) {
              if (ytPlaylists[i].id === spPlaylist.id) {
                ytPlaylistIndex = i
                break
              }
            }
          }
          let ytPlaylist = ytPlaylists[ytPlaylistIndex]

          if (dlPlaylistIndex === null) {
            for (let i = 0; i < dlPlaylists.length; i++) {
              if (dlPlaylists[i].id === spPlaylist.id) {
                dlPlaylistIndex = i
                break
              }
            }
          }
          let dlPlaylist = dlPlaylists[dlPlaylistIndex]

          let spTrack = spPlaylist.tracks.items[trackIndex]
          let ytTrack = ytPlaylist.tracks.find(track => track.id === spTrack.id)
          let dlTrack = dlPlaylist.tracks.find(track => track.songbasket_spotify_id === spTrack.id)

          // Condition to skip a download
          // To be skippable Downloaded track must be in disk and YT Selection must be the same
          // If YT Selection differs, skipTrack removes file from disk
          if (dlTrack !== undefined && skipTrack(ytTrack.selected, dlTrack)) {
            console.log('SKIPPING', spTrack.name)
            return downloadLoop({playlistIndex, ytPlaylistIndex, dlPlaylistIndex, trackIndex: trackIndex + 1})
          }

          let {name, id} = spTrack
          // declaring write paths
          let fullPath = process.env.HOME_FOLDER + '/' + spPlaylist.name
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
            downloadLoop({playlistIndex, ytPlaylistIndex, dlPlaylistIndex, trackIndex: trackIndex + 1})
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
              fs.unlink(pathmp4)
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

    function downloadLinkRemove (localTracks, queryTracks) {
      let download = []
      let link = []
      let remove = []

      for (let i = 0; i < queryTracks.length; i++) {
        qt = queryTracks[i]
        for (let o = 0; o < localTracks.length; o++) {
          lt = localTracks[o]
          if (qt.id === lc.songbasket_spotify_id) { // same SP Track
            let sameVer = false
            let found = false
            for (let u = 0; u > qt.conversion.playlists.length; u++) {
              let pl = qt.conversion.playlists[u]
              samePl = pl.id === lt.playlist
              sameVer = pl.conversion === lt.songbasket_youtube_id

              if (sameVer && samePl) {
                found = true
                qt.conversion.playlists.splice(u, 1)
              } else {
                if (samePl) {
                  
                }
                if (sameVer) {
                  link.push()
                }
              }
            }
          }
          
        }
      }
      return {download, link, remove}
    }
  }
}
