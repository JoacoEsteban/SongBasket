declare module NodeJS {
  // import sudo from 'sudo-prompt'
  interface Global {
    pathExists: typeof import('path-exists')
    sudo: typeof import('sudo-prompt').exec
    ipcSend: typeof import('../main/controllers/InitializationAndHandlers/ipc.controller').default.send
    // ------------------------------------------
    ENV_PROD: boolean
    IS_DEV: boolean
    CONSTANTS: import('./constants').Constants,
    log: (...args: any) => void,
    emptyFn: () => void,
    __static: string,
    flushYtDlCache: () => Promise<string>
  }
}
