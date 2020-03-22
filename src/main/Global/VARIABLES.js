module.exports = {
  FFMPEG_BINS_DOWNLOADED: false,
  HOME_PUSHED: false,
  WINDOW_FINISHED_LOADING: false,
  DOCUMENT_FINISHED_LOADING: false,
  ONLINE: false,
  BACKEND: process.env.BACKEND,
  MAIN_WINDOW: null,
  LOGIN_WINDOW: null,
  VUEX: require('../../renderer/store').default,
  SAVE_TO_DISK: null,
  APP_CWD: (process.env.NODE_ENV === 'production' ? require('electron').app.getPath('userData') : process.cwd()),
  PLATFORM: (() => {
    switch (process.platform) {
      case 'darwin':
        return 'mac'
      default:
        if (process.platform.includes('win')) return 'windows'
        return 'other'
    }
  })()
}
