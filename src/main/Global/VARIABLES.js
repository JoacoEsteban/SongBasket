// const config = (async () => {

// })()
const height = 500
const width = 1000
const ENV_PROD = process.env.NODE_ENV === 'production'
const IS_DEV = !ENV_PROD

const APP_VERSION = require('electron').app.getVersion()
const APP_VERSION_STRING = (APP_VERSION + ' ') + (IS_DEV ? 'Electron. Development' : 'Closed Beta')
module.exports = global.CONSTANTS = {
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
  BROWSER_WINDOW: null,
  SESSION: null,
  DIALOG: null,
  // -------------

  // PATHS
  get BACKEND () {
    return process.env.BACKEND
  },
  APP_CWD: (ENV_PROD ? require('electron').app.getPath('userData') : process.cwd()),
  PROTOCOL_PATHS: {
    BASE: 'songbasket'
  },
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
  HEROKU_PING_INTERVAL: 1000 * 60 * 15,
  APP_VERSION,
  APP_VERSION_STRING,
  CHANGELOG_URL: 'https://download.songbasket.com'
  // -------------

}
