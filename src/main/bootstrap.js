import sudo from 'sudo-prompt'
import * as handlers from './controllers/InitializationAndHandlers/handlers'
import * as utils from '../MAIN_PROCESS_UTILS'
const PATH = require('path')
console.log(PATH.join(global.CONSTANTS.APP.getAppPath()))
// ---------------------sudo-prompt---------------------
global.sudo = sudo;
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
  const youtubeDl = require('youtube-dl')

  class YoutubeDlVersionManager {
    constructor () {
      this.fs = require('fs').promises
      this.createWriteStream = require('fs').createWriteStream
      this.axios = require('axios')
      this.fetch = this.axios.get
      this.binariesPath = global.CONSTANTS.YTDL_BINARIES_PATH
      this.versionControlPath = global.CONSTANTS.YTDL_VERSION_CONTROL_PATH

      this.apiUrl = 'https://api.github.com/repos/ytdl-org/youtube-dl/releases/latest'

      this.setLocals()
    }

    async findLocalVersion () {
      try {
        // TODO check if binary exists
        // if not then delete json
        this.localVersion = JSON.parse(await this.fs.readFile(this.versionControlPath, 'utf8'))
      } catch (error) {
        this.localVersion = null
      }
      this.localVersion && console.log('youtube-dl local version is', this.localVersion.id)
    }
    async findLatestVersion () {
      console.log('Finding youtube-dl latest version info')
      try {
        this.latestVersion = (await this.fetch(this.apiUrl))?.data
      } catch (error) {
        this.latestVersion = null
        console.error('UNABLE TO RETRIEVE LATEST YOUTUBE-DL VERSION:\n', error)
      }
      this.latestVersion && console.log('youtube-dl latest version is', this.latestVersion.id)
    }
    async writeLocalVersion () {
      await this.fs.writeFile(this.versionControlPath, JSON.stringify(this.latestVersion))
      this.localVersion = this.latestVersion
    }
    // ------------------------------------------
    setLocals () {
      this.assetName = ({
        windows: 'youtube-dl.exe',
        mac: 'youtube-dl',
        linux: 'youtube-dl'
      })[global.CONSTANTS.PLATFORM]
    }
    async findData () {
      const stack = []
      if (!this.latestVersion) stack.push(this.findLatestVersion)
      if (!this.localVersion) stack.push(this.findLocalVersion)
      await Promise.all(stack.map(fn => fn.bind(this)()))
    }
    async hasUpdates () {
      await this.findData()
      return this.localVersion?.id !== this.latestVersion?.id
    }
    // ---------------------
    getBinaryPath () {
      const asset = this.getAsset()
      return asset && PATH.join(this.binariesPath, asset.name)
    }
    getAsset () {
      return this.latestVersion.assets.find(({ name }) => name === this.assetName)
    }
    async update () {
      console.log('about to update youtube-dl from', this.localVersion?.id || '?', 'to', this.latestVersion.id)
      const asset = this.getAsset()
      if (!asset) throw new Error('YOUTUBE-DL RELEASE ASSET NOT FOUND')

      await utils.createDirRecursive(this.binariesPath)
      const binaryPath = this.getBinaryPath()
      const writer = this.createWriteStream(binaryPath)
      this.axios({
        method: 'get',
        url: asset.browser_download_url,
        responseType: 'stream'
      }).then(res => res.data.pipe(writer))

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      console.log('youtube-dl binaries downloaded')

      // SET EXECUTION PERMISSIONS
      await this.setExecutionPermissions()

      this.writeLocalVersion()
    }
    async setExecutionPermissions () {
      if (global.CONSTANTS.platform !== 'windows') {
        try {
          console.log('setting execution permissions to yt-dl binary')
          await new Promise((resolve, reject) => global.sudo.exec('chmod +x ' + this.getBinaryPath(), { name: 'SongBasket' }, error => error ? reject(error) : resolve()))
          console.log('execution permissions set to yt-dl binary')
        } catch (error) {
          console.error('ERROR SETTING EXECUTION PERMISSIONS', error)
          throw error
        }
      }
    }
    async checkNUpdate () {
      if (await this.hasUpdates()) await this.update()
      else console.log('youtube-dl is up to date')

      this.updateLibraryPaths()
    }
    updateLibraryPaths () {
      youtubeDl.setYtdlBinary(this.getBinaryPath())
    }
  }

  const versionManager = new YoutubeDlVersionManager()
  versionManager.checkNUpdate()
  // console.log(versionManager.checkNUpdate)

  // ------------------------------------------
  const exec = require('child_process').exec
  global.flushYtDlCache = () => new Promise((resolve, reject) => {
    exec(youtubeDl.getYtdlBinary() + ' --rm-cache-dir', (err, out) => {
      if (err) {
        console.error('Error flushding ytdl cache', err)
        return reject(err)
      }
      resolve(out)
    })
  })
  // global.flushYtDlCache().catch(global.emptyFn)
})()
