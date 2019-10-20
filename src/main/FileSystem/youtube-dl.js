import store from '../../renderer/store'
import customGetters from '../../renderer/store/customGetters'

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

// ffmpeg.setFfmpegPath("./bin/ffmpeg/bin")

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
            convertMp3(fullPathmp3, fullPathmp4)
          })
        }
      }
    }

    function convertMp3 (pathmp3, pathmp4) {
      return new Promise(() => {
        let command =
          ffmpeg(pathmp4)
            .inputFormat('mp4')
            .on('end', () => {
              console.log('Finished processing')
            })

        command.save(pathmp3)
      })
    }
  }
}
