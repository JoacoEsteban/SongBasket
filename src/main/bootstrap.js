import youtubeDl from 'youtube-dl'
import sudo from 'sudo-prompt'
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
// ---------------------utlis---------------------
global.pathExists = require('path-exists')
global.sudo = sudo

global.ipcSend = (...args) => {
  if (!global.CONSTANTS.MAIN_WINDOW) return
  return IpcController.send(...args)
}

async function botstrapFfmpeg () {
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
}

async function botstrapYoutubeDl () {
  const manager = new YoutubeDlVersionManager()
  await manager.checkNUpdate()
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
}

// ---------------------FLOW---------------------
export default async electron => {
  global.ipc = electron.ipcMain
  {
    const { BrowserWindow, session, dialog, shell } = electron
    global.CONSTANTS.BROWSER_WINDOW = BrowserWindow
    global.CONSTANTS.SESSION = session
    global.CONSTANTS.DIALOG = dialog
    global.CONSTANTS.SHELL_OPEN = shell.openItem
  }

  await Promise.all([
    // ---------------------ffmepeg---------------------
    botstrapFfmpeg(),
    // ---------------------youtube-dl---------------------
    botstrapYoutubeDl()
  ])

  console.log('finished ffmpeg && youtubedl')

  await new Promise((resolve, reject) => {
    const createMenu = ({ globalShortcut }) => {
      if (global.ENV_PROD) {
        globalShortcut.register('f5', global.emptyFn)
        globalShortcut.register('CmdOrCtrl+R', global.emptyFn)
      }
    }

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

      ipcRoutes()

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
  })
}
