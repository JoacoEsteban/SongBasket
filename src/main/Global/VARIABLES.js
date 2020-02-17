module.exports = {
  FFMPEG_BINS_DOWNLOADED: false,
  HOME_PUSHED: false,
  WINDOW_FINISHED_LOADING: false,
  DOCUMENT_FINISHED_LOADING: false,
  ONLINE: false,
  BACKEND: process.env.BACKEND,
  MAIN_WINDOW: null,
  LOGIN_WINDOW: null,
  VUEX: require('../../renderer/store').default
}
