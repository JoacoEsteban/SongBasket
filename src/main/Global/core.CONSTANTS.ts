/* eslint-disable import/first */
import { app } from 'electron'
import * as PATH from 'path'
import { Platform } from '../../@types/App'
import FEATURES from './core.FEATURES'

const ENV_PROD = global.ENV_PROD = process.env.NODE_ENV === 'production'
const USE_PROD_BACKEND = true
const IS_DEV = global.IS_DEV = !ENV_PROD

const height = 500
const width = 1000

const PROCESS_CWD = process.cwd()
const APP_CWD = PATH.join(app.getAppPath())
const APP_VERSION = app.getVersion()
const APP_SUPPORT_PATH = (ENV_PROD ? app.getPath('userData') : PATH.join(process.cwd(), 'APPLICATION_SUPPORT'))

export default global.CONSTANTS = {
  // STATES
  ENV_PROD,
  IS_DEV,
  APP_VERSION: app.getVersion(),
  APP_VERSION_STRING: (APP_VERSION + ' ') + (IS_DEV ? 'Electron. Development' : 'Closed Beta'),
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
      downloadPtg: 0,
      updateDownloaded: false
    }
  },
  FFMPEG_BINS_DOWNLOADED: false,
  CLEAN_CREDS_ON_LOGOUT: false,
  // -------------

  // PATHS
  BACKEND: process.env.BACKEND || (() => {
    const subDomain = 'api'
    return process.env.BACKEND = ENV_PROD || USE_PROD_BACKEND ? ('https://' + subDomain + '.songbasket.com') : 'http://localhost:5000'
  })(),
  NODE_MODULES_PATH: PATH.join(ENV_PROD ? APP_CWD.replace('app.asar', 'app.asar.unpacked') : PROCESS_CWD, 'node_modules'),
  APP_SUPPORT_PATH,
  FFMPEG_BINARIES_PATH: PATH.join(APP_SUPPORT_PATH, 'bin', 'ffmpeg'),
  YTDL_BINARIES_PATH: PATH.join(APP_SUPPORT_PATH, 'bin', 'ytdl'),
  YTDL_VERSION_CONTROL_PATH: PATH.join(APP_SUPPORT_PATH, 'ytdl-version.json'),
  APP_CWD,
  PROCESS_CWD,
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
        return Platform.mac
      default:
        if (process.platform.includes('win')) return Platform.windows
        return Platform.linux
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
