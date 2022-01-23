import * as electron from 'electron'
import * as youtubeDl from 'youtube-dl'
import * as ffmpeg from 'fluent-ffmpeg'
import * as ffbinaries from 'ffbinaries'
import { exec } from 'child_process'
import * as sudo from 'sudo-prompt'
import * as pathExists from 'path-exists'
import * as handlers from './controllers/InitializationAndHandlers/handlers'
import * as utils from '../MAIN_PROCESS_UTILS'

import connectionController from './controllers/InitializationAndHandlers/connection.controller'
import protocolController from './controllers/InitializationAndHandlers/protocol.controller'
import updater from './controllers/InitializationAndHandlers/auto-update'
import IpcController from './controllers/InitializationAndHandlers/ipc.controller'
import WindowController from './controllers/InitializationAndHandlers/window.controller'
import core from './controllers/InitializationAndHandlers/core.controller'
import YoutubeDlVersionManager from './utils/youtube-dl-version-manager'
import ipcRoutes from './controllers/InitializationAndHandlers/ipc.routes'
import { Platform } from '../@types/App'
// import ipcMain from 'electron-better-ipc'
// ---------------------utlis---------------------
global.pathExists = pathExists
global.sudo = sudo

global.ipcSend = IpcController.send

async function botstrapFfmpeg () {
  const binPath = global.CONSTANTS.FFMPEG_BINARIES_PATH

  await utils.createDirRecursive(binPath)
  ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], { destination: binPath }, () => {
    global.CONSTANTS.FFMPEG_BINS_DOWNLOADED = true
    handlers.onFfmpegBinaries()
    ffmpeg.setFfmpegPath(binPath + '/ffmpeg')
    ffmpeg.setFfprobePath(binPath + '/ffprobe')
  })
}

async function botstrapYoutubeDl () {
  const manager = new YoutubeDlVersionManager()
  await manager.checkNUpdate()
  // ------------------------------------------
  global.flushYtDlCache = () => new Promise((resolve, reject) => {
    // @ts-ignore
    exec(`"${youtubeDl.getYtdlBinary()}"` + ' --rm-cache-dir', (err, out) => {
      if (err) {
        console.error('Error flushding ytdl cache', err)
        return reject(err)
      }
      resolve(out)
    })
  })
  // global.flushYtDlCache().catch(global.emptyFn)
}

// ---------------------FLOW---------------------
export default async () => {
  const electronInitPromise: Promise<void> = new Promise((resolve, reject) => {
    const createMenu = () => {
      const { globalShortcut } = electron
      if (global.ENV_PROD) {
        globalShortcut.register('f5', global.emptyFn)
        globalShortcut.register('CmdOrCtrl+R', global.emptyFn)
      }
    }

    const onReady = async () => {
      console.log('onready')
      WindowController.createLoadingWindow()

      global.CONSTANTS.ENV_PROD && updater.init()
      protocolController.startProtocols()
      connectionController.init({
        connectionChangeCallback: (value: boolean) => {
          global.ipcSend('CONNECTION:CHANGE', value)
        },
        apiConnectionChangeCallback: (value: boolean) => {
          global.ipcSend('API_CONNECTION:CHANGE', value)
        }
      })
      createMenu()
      await core.setAppStatus()

      ipcRoutes()

      resolve()
    }

    electron.app.allowRendererProcessReuse = true

    electron.app.on('window-all-closed', () => {
      if (global.CONSTANTS.PLATFORM !== Platform.mac) {
        // TODO Manage background processing on every platform
        electron.app.quit()
      }
    })

    electron.app.on('activate', () => {
      if (global.CONSTANTS.MAIN_WINDOW === null) WindowController.onAppInit()
    })

    electron.app.on('will-quit', () => {
      electron.globalShortcut.unregisterAll()
    })

    electron.app.isReady() ? onReady() : electron.app.on('ready', onReady)
  })

  electronInitPromise.then(WindowController.onAppInit)
  await Promise.all([
    // ---------------------ffmepeg---------------------
    botstrapFfmpeg(),
    // ---------------------youtube-dl---------------------
    botstrapYoutubeDl(),
    // ---------------------electron---------------------
    electronInitPromise
  ])
}
