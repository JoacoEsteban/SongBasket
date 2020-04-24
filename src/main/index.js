import electron from 'electron'
import log from 'electron-log'
import dotenvConfig from './dotenvConfig'
console.log(dotenvConfig) // logging for linter not to complain

global.log = (...aa) => aa.forEach(a => console.log(require('util').inspect(a, {showHidden: false, depth: null})))

require('./controllers/InitializationAndHandlers/handlers').init(electron)
require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)

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
