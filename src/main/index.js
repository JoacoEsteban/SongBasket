import electron from 'electron'
const logFile = require('electron-log')
require('./dotenvConfig')

global.log = (...aa) => aa.forEach(a => console.log(require('util').inspect(a, {showHidden: false, depth: null})))

const debug = false
if (process.env.NODE_ENV === 'production' || debug) {
  const toLogFile = error => {
    console.error('----------UNCAUGHT----------\n', error)
    logFile.error(error)
  }
  process.on('uncaughtException', toLogFile)
  process.on('unhandledRejection:', toLogFile)

  const stdoutToFile = true
  if (stdoutToFile) {
    const fs = require('fs')
    const path = require('path')

    const logsPath = path.join((process.env.NODE_ENV === 'production' ? require('electron').app.getPath('userData') : process.cwd()), 'logs')
    if (!fs.existsSync(logsPath)) fs.mkdirSync(logsPath)
    const access = fs.createWriteStream(path.join(logsPath, 'SONGBASKET RUNTIME LOG - ' + new Date()))
    process.stdout.write = process.stderr.write = access.write.bind(access)
  }
}

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

require('./controllers/InitializationAndHandlers/handlers').init(electron)
require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)
