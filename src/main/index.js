import electron from 'electron'
import log from 'electron-log'
import dotenvConfig from './dotenvConfig'
console.log(dotenvConfig) // logging for linter not to complain

require('./InitializationAndHandlers/handlers').init(electron)
require('./InitializationAndHandlers/ipc.routes').init(electron.ipcMain)

let a = true
if (process.env.NODE_ENV === 'production' || a) {
  process.on('uncaughtException', function (error) {
    log.warn(error)
  })
}

console.log('Home folder: ', global.HOME_FOLDER)

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}
