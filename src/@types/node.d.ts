import { SongbasketFoldersFile, SongBasketId } from './SongBasket'
import { SpotifyUser } from './Spotify'

declare global {
  namespace NodeJS {
    // import sudo from 'sudo-prompt'
    interface Global {
      pathExists: typeof import('path-exists')
      sudo: typeof import('sudo-prompt').exec
      ipcSend: typeof import('../main/controllers/InitializationAndHandlers/ipc.controller').default.send
      USER_ID: SpotifyUser['id'] | null,
      SONGBASKET_ID: SongBasketId | null,
      // ------------------------------------------
      ENV_PROD: boolean
      IS_DEV: boolean
      CONNECTED_TO_INTERNET: boolean
      CONNECTED_TO_API: boolean
      CONSTANTS: import('./constants').Constants,
      log: (...args: any) => void,
      emptyFn: () => void,
      __static: string,
      flushYtDlCache: () => Promise<string>,
      FEATURES: {},
      HOME_FOLDER: string,
      SESSION_FOLDER_PATHS: SongbasketFoldersFile,
      openUrl: typeof import('open'),
    }
  }

  namespace Electron {
    interface BrowserWindow {
      setPositionSafe: BrowserWindow['setPosition']
    }
  }
}
