/* eslint-disable import/first */
import { app, BrowserWindow, session, dialog, shell } from 'electron'
import * as PATH from 'path'
import { Constants } from '../../@types/constants'
import FEATURES from './core.FEATURES'

const ENV_PROD = global.ENV_PROD = process.env.NODE_ENV === 'production'
const USE_PROD_BACKEND = true
const IS_DEV = global.IS_DEV = !ENV_PROD

const height = 500
const width = 1000

const cons: any = {
  // STATES
  ENV_PROD,
  IS_DEV,
  APP_STATUS: {
    IS_LOGGED: false,
    FOLDERS: {
      paths: [],
      selected: null
    },
    UPDATES: {
      updateError: null,
      updateAvailable: false,
      updateVersion: null,
      downloadInProgress: false,
      downloadPtg: null,
      updateDownloaded: false
    }
  },
  FFMPEG_BINS_DOWNLOADED: false,
  CLEAN_CREDS_ON_LOGOUT: false,
  // -------------

  // ELECTRON DEFAULTS
  APP: app,
  BROWSER_WINDOW: BrowserWindow,
  SESSION: session,
  DIALOG: dialog,
  SHELL_OPEN: shell.openPath,
  // -------------

  // PATHS
  BACKEND: process.env.BACKEND || (() => {
    const subDomain = 'api'
    return process.env.BACKEND = ENV_PROD || USE_PROD_BACKEND ? ('https://' + subDomain + '.songbasket.com') : 'http://localhost:5000'
  })(),
  APP_SUPPORT_PATH: (ENV_PROD ? app.getPath('userData') : PATH.join(process.cwd(), 'APPLICATION_SUPPORT')),
  APP_CWD: PATH.join(app.getAppPath()),
  PROCESS_CWD: process.cwd(),
  TEMP_PATH: app.getPath('temp'),
  PROTOCOL_PATHS: {
    BASE: 'songbasket'
  },
  // -------------

  // INSTANCES
  MAIN_WINDOW: null,
  LOADING_WINDOW: null,
  LOGIN_WINDOW: null,
  // -------------
  PLATFORM: (() => {
    switch (process.platform) {
      case 'darwin':
        return 'mac'
      default:
        if (process.platform.includes('win')) return 'windows'
        return 'other'
    }
  })(),
  MAIN_WINDOW_CONFIG: {
    width,
    height,
    frame: false,
    minWidth: width,
    minHeight: height,
    backgroundColor: '#151515',
    useContentSize: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: true
    }
  },
  LOADING_WINDOW_CONFIG: {
    width,
    height,
    frame: false,
    minWidth: width,
    minHeight: height,
    backgroundColor: '#151515',
    useContentSize: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  },
  POPUP_WINDOW_CONFIG: {
    // frame: false,
    webPreferences: {
      nodeIntegration: false
    },
    width: 550,
    height: 830,
    minWidth: 550,
    minHeight: 830,
    useContentSize: true
    // icon: PATH.join(__dirname, 'assets/icons/png/icon_128@1x.png')
  },
  // MISC
  HEROKU_PING_INTERVAL: 1000 * 60 * 2,
  CHANGELOG_URL: 'https://download.songbasket.com',
  FEATURES
  // -------------

}
cons.NODE_MODULES_PATH = PATH.join(ENV_PROD ? cons.APP_CWD.replace('app.asar', 'app.asar.unpacked') : cons.PROCESS_CWD, 'node_modules')

cons.APP_VERSION = cons.APP.getVersion()
cons.APP_VERSION_STRING = (cons.APP_VERSION + ' ') + (IS_DEV ? 'Electron. Development' : 'Closed Beta')

cons.FFMPEG_BINARIES_PATH = PATH.join(cons.APP_SUPPORT_PATH, 'bin', 'ffmpeg')
cons.YTDL_BINARIES_PATH = PATH.join(cons.APP_SUPPORT_PATH, 'bin', 'ytdl')
cons.YTDL_VERSION_CONTROL_PATH = PATH.join(cons.APP_SUPPORT_PATH, 'ytdl-version.json')

const CONSTANTS: Constants = cons

global.CONSTANTS = CONSTANTS

export default cons
