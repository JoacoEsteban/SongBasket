// const config = (async () => {

// })()
const height = 500
const width = 1000
module.exports = global.CONSTANTS = {
  // STATES
  APP_STATUS: {
    IS_LOGGED: false,
    FOLDERS: {
      paths: [],
      selected: null
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
  APP_CWD: (process.env.NODE_ENV === 'production' ? require('electron').app.getPath('userData') : process.cwd()),
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
    useContentSize: true,
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
  HEROKU_PING_INTERVAL: 1000 * 60 * 15
  // -------------

}
