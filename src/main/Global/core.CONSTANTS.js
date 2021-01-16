const PATH = require('path')

const height = 500
const width = 1000
const ENV_PROD = global.ENV_PROD = process.env.NODE_ENV === 'production'
const IS_DEV = global.IS_DEV = !ENV_PROD

const APP = require('electron').app
const CONSTANTS = module.exports = global.CONSTANTS = {
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
  APP,
  BROWSER_WINDOW: null,
  SESSION: null,
  DIALOG: null,
  SHELL_OPEN: () => { },
  // -------------

  // PATHS
  get BACKEND () {
    return process.env.BACKEND
  },
  APP_SUPPORT_PATH: (ENV_PROD ? APP.getPath('userData') : PATH.join(process.cwd(), 'APPLICATION_SUPPORT')),
  APP_CWD: PATH.join(APP.getAppPath()),
  PROCESS_CWD: process.cwd(),
  get NODE_MODULES_PATH () {
    return this.__node_modules_path || (this.__node_modules_path = PATH.join(ENV_PROD ? this.APP_CWD.replace('app.asar', 'app.asar.unpacked') : this.PROCESS_CWD, 'node_modules'))
  },
  TEMP_PATH: APP.getPath('temp'),
  PROTOCOL_PATHS: {
    BASE: 'songbasket'
  },
  FFMPEG_BINARIES_PATH: null,
  // -------------

  // INSTANCES
  MAIN_WINDOW: null,
  LOGIN_WINDOW: null,
  VUEX: require('../../renderer/store').default,
  SAVE_TO_DISK: null,
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
    // icon: require('path').join(__dirname, 'assets/icons/png/icon_128@1x.png')
  },
  // MISC
  HEROKU_PING_INTERVAL: 1000 * 60 * 2,
  APP_VERSION: null,
  APP_VERSION_STRING: null,
  CHANGELOG_URL: 'https://download.songbasket.com',
  FEATURES: require('./core.FEATURES')
  // -------------

}

CONSTANTS.APP_VERSION = CONSTANTS.APP.getVersion()
CONSTANTS.APP_VERSION_STRING = (CONSTANTS.APP_VERSION + ' ') + (IS_DEV ? 'Electron. Development' : 'Closed Beta')

CONSTANTS.FFMPEG_BINARIES_PATH = PATH.join(global.CONSTANTS.APP_SUPPORT_PATH, 'bin', 'ffmpeg')
CONSTANTS.YTDL_BINARIES_PATH = PATH.join(global.CONSTANTS.APP_SUPPORT_PATH, 'bin', 'ytdl')
CONSTANTS.YTDL_VERSION_CONTROL_PATH = PATH.join(global.CONSTANTS.APP_SUPPORT_PATH, 'ytdl-version.json')
