require('./Global/VARIABLES')

const USE_PROD_BACKEND = true
const USE_HEROKU = true
;(() => {
  const subDomain = USE_HEROKU ? 'heroku' : 'api'
  process.env.BACKEND = process.env.NODE_ENV === 'production' || USE_PROD_BACKEND ? 'https://' + subDomain + '.songbasket.com' : 'localhost:5000'
  global.log = (...aa) => aa.forEach(a => console.log(require('util').inspect(a, {showHidden: false, depth: null})))
})()

const CATCH_TO_FILE = false
const logFile = require('electron-log')
;(function setErrorHandling () {
  if (process.env.NODE_ENV === 'production' || CATCH_TO_FILE) {
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
})()
