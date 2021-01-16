import sudo from 'sudo-prompt'
import * as handlers from './controllers/InitializationAndHandlers/handlers'
import * as utils from '../MAIN_PROCESS_UTILS'

import connectionController from './controllers/InitializationAndHandlers/connection.controller'
import protocolController from './controllers/InitializationAndHandlers/protocol.controller'
import updater from './controllers/InitializationAndHandlers/auto-update'
import IpcController from './controllers/InitializationAndHandlers/ipc.controller'
import WindowController from './controllers/InitializationAndHandlers/window.controller'
import core from './controllers/InitializationAndHandlers/core.controller'

const PATH = require('path')
// ---------------------utlis---------------------
global.pathExists = require('path-exists')
global.sudo = sudo

global.ipcSend = (...args) => {
  if (!global.CONSTANTS.MAIN_WINDOW) return
  return IpcController.send(...args)
}

// ---------------------FLOW---------------------
console.log('before expor', module)
export default electron => new Promise(async (resolve, reject) => {
  await Promise.all([
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
    })(),
    // ---------------------youtube-dl---------------------
    (async function botstrapYoutubeDl () {
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
            console.log('Finding youtube-dl local version info')
            this.localVersion = JSON.parse(await this.fs.readFile(this.versionControlPath, 'utf8'))
          } catch (error) {
            this.localVersion = null
          }

          const jsonExists = !!this.localVersion
          const binaryExists = await global.pathExists(this.getBinaryPath())

          if (jsonExists ? !binaryExists : binaryExists) { // XOR
            console.log('youtube-dl ' + (jsonExists ? 'Binary' : 'JSON') + ' doesn\'t exist, wiping both')
            await this.wipeAll()
          }

          this.localVersion && console.log('youtube-dl local version is', this.localVersion.id)
        }

        async wipeVersionInfo () {
          this.fs.unlink(this.versionControlPath).catch(global.emptyFn)
          this.localVersion = null
        }

        async wipeBinary (binaryPath = this.getBinaryPath()) {
          this.fs.unlink(binaryPath).catch(global.emptyFn)
        }

        async wipeAll (binaryPath) {
          await Promise.all([
            this.wipeVersionInfo(),
            this.wipeBinary(binaryPath)
          ])
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
        getBinaryPath (asset = this.getLocalAsset()) {
          return asset && PATH.join(this.binariesPath, asset.name)
        }
        getLocalAsset () {
          return this.localVersion?.assets.find(({ name }) => name === this.assetName)
        }
        getLatestAsset () {
          return this.latestVersion?.assets.find(({ name }) => name === this.assetName)
        }

        async update () {
          console.log('about to update youtube-dl from', this.localVersion?.id || '?', 'to', this.latestVersion.id)
          const asset = this.getLatestAsset()
          if (!asset) throw new Error('YOUTUBE-DL RELEASE ASSET NOT FOUND')

          const binaryPath = this.getBinaryPath(asset)
          await Promise.all([
            utils.createDirRecursive(this.binariesPath),
            this.wipeBinary(binaryPath)
          ])

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
          await this.writeLocalVersion()

          // SET EXECUTION PERMISSIONS
          try {
            await this.setExecutionPermissions()
          } catch (error) {
            await this.wipeAll(binaryPath)
          }
        }

        async setExecutionPermissions () {
          if (global.CONSTANTS.platform !== 'windows') {
            try {
              console.log('setting execution permissions to yt-dl binary')
              const binPath = this.getBinaryPath()
              if (!binPath) throw new Error('NO BINARY PATH')
              await new Promise((resolve, reject) => global.sudo.exec('chmod +x ' + `"${binPath}"`, { name: 'SongBasket' }, error => error ? reject(error) : resolve()))
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
          console.log('\n\nsetting youtube binary ', this.getBinaryPath())
          youtubeDl.setYtdlBinary(this.getBinaryPath())
        }
      }

      const versionManager = new YoutubeDlVersionManager()
      await versionManager.checkNUpdate()
      // console.log(versionManager.checkNUpdate)

      // ------------------------------------------
      const exec = require('child_process').exec
      global.flushYtDlCache = () => new Promise((resolve, reject) => {
        exec(`"${youtubeDl.getYtdlBinary()}"` + ' --rm-cache-dir', (err, out) => {
          if (err) {
            console.error('Error flushding ytdl cache', err)
            return reject(err)
          }
          resolve(out)
        })
      })
      // global.flushYtDlCache().catch(global.emptyFn)
    })()
  ])

  console.log('finished ffmpeg && youtubedl')

  await (async () => new Promise((resolve, reject) => {
    const createMenu = ({ globalShortcut }) => {
      if (global.ENV_PROD) {
        globalShortcut.register('f5', global.emptyFn)
        globalShortcut.register('CmdOrCtrl+R', global.emptyFn)
      }
    }

    (() => {
      const { BrowserWindow, session, dialog, shell } = electron
      global.CONSTANTS.BROWSER_WINDOW = BrowserWindow
      global.CONSTANTS.SESSION = session
      global.CONSTANTS.DIALOG = dialog
      global.CONSTANTS.SHELL_OPEN = shell.openItem
    })()

    electron.app.allowRendererProcessReuse = true

    const onReady = async () => {
      console.log('onready')
      global.CONSTANTS.ENV_PROD && updater.init()
      protocolController.startProtocols(electron)
      connectionController.init({
        connectionChangeCallback: (value) => {
          global.ipcSend('CONNECTION:CHANGE', value)
        },
        apiConnectionChangeCallback: (value) => {
          global.ipcSend('API_CONNECTION:CHANGE', value)
        }
      })
      createMenu(electron)
      await core.setAppStatus()

      require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)

      WindowController.createWindow()

      resolve()
    }
    electron.app.isReady() ? onReady() : electron.app.on('ready', onReady)

    electron.app.on('window-all-closed', () => {
      if (global.CONSTANTS.PLATFORM !== 'mac') {
        // TODO Manage background processing on every platform
        electron.app.quit()
      }
    })

    electron.app.on('activate', () => {
      if (global.CONSTANTS.MAIN_WINDOW === null) WindowController.createWindow()
    })

    electron.app.on('will-quit', () => {
      electron.globalShortcut.unregisterAll()
    })
  }))()

  resolve()
})

console.log('after expor')
