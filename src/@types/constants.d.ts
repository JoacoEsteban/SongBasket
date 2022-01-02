import { BrowserWindow } from 'electron'
import { Platform } from './App'

type WindowConfig = {
  width: number,
  height: number,
  frame?: boolean,
  minWidth: number,
  minHeight: number,
  backgroundColor?: string,
  useContentSize: boolean,
  resizable?: boolean,
  webPreferences: {
    nodeIntegration: boolean
  }
}

export type Constants = {
  // STATES
  ENV_PROD: boolean,
  IS_DEV: boolean,
  APP_STATUS: {
    IS_LOGGED: boolean,
    FOLDERS: {
      paths: string[],
      selected: null | string
    },
    UPDATES: {
      updateError: null,
      updateAvailable: boolean,
      updateVersion: null,
      downloadInProgress: boolean,
      downloadPtg: null,
      updateDownloaded: boolean
    }
  },
  FFMPEG_BINS_DOWNLOADED: boolean,
  CLEAN_CREDS_ON_LOGOUT: boolean,
  // -------------

  // PATHS
  BACKEND: string,
  APP_SUPPORT_PATH: string,
  APP_CWD: string,
  PROCESS_CWD: string,
  NODE_MODULES_PATH: string,
  TEMP_PATH: string,
  PROTOCOL_PATHS: {
    BASE: 'songbasket'
  },
  FFMPEG_BINARIES_PATH: string,
  YTDL_BINARIES_PATH: string,
  YTDL_VERSION_CONTROL_PATH: string,
  // -------------

  // INSTANCES
  MAIN_WINDOW: BrowserWindow | null,
  LOADING_WINDOW: BrowserWindow | null,
  LOGIN_WINDOW: BrowserWindow | null,
  // -------------
  PLATFORM: Platform,
  MAIN_WINDOW_CONFIG: WindowConfig,
  LOADING_WINDOW_CONFIG: WindowConfig,
  POPUP_WINDOW_CONFIG: WindowConfig,
  // MISC
  HEROKU_PING_INTERVAL: number,
  APP_VERSION: string,
  APP_VERSION_STRING: string,
  CHANGELOG_URL: string,
  FEATURES: {}
  // -------------

}
