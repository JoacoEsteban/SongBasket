let fs = require('fs')
let youtubedl = require('youtube-dl')
let ffmpeg = require('ffmpeg')

// ffmpeg.setFfmpegPath("./bin/ffmpeg/bin")

let pathmp4 = 'probando12.mp4'
let pathmp3 = 'probando34.mp3'

let url = 'https://www.youtube.com/watch?v=VbPMmxG8rUU'
let video = youtubedl(url,
  // Optional arguments passed to youtube-dl.
  ['--format=18'],
  // Additional options can be given for calling `child_process.execFile()`.
  { cwd: __dirname })

// Will be called when the download starts.
let size = 0
video.on('info', function (info) {
  console.log('Download started')
  console.log('filename: ' + info._filename)
  console.log('size: ' + info.size)
  size = info.size
})

video.pipe(fs.createWriteStream(pathmp4))

let current = 0

video.on('data', (chunk) => {
  current += chunk.length
  console.log(Math.round(current / size * 100) + '%')
})

video.on('end', function () {
  try {
    ffmpeg(pathmp4, function (err, video) {
      if (!err) {
        console.log('The video is ready to be processed')

        video.fnExtractSoundToMP3(pathmp3, (err, files) => console.log(err, files))
      } else {
        console.log('Error: ' + err)
      }
    })
  } catch (e) {
    console.log(e.code)
    console.log(e.msg)
  }
})
