import './env'
import './controllers/Prototype'
import './Global/core.CONSTANTS'
import util from 'util'
import logFile from 'electron-log'
import fs from 'fs'
import path from 'path'

const PROD = global.CONSTANTS.ENV_PROD

const USE_PROD_BACKEND = true

{
  const subDomain = 'api'
  process.env.BACKEND = PROD || USE_PROD_BACKEND ? ('https://' + subDomain + '.songbasket.com') : 'http://localhost:5000'
  global.log = (...aa) => aa.forEach(a => console.log(util.inspect(a, { showHidden: false, depth: null })))
}

const CATCH_TO_FILE = false;

(function setErrorHandling () {
  if (PROD || CATCH_TO_FILE) {
    console.log = console.info
    const toLogFile = error => {
      console.error('----------UNCAUGHT----------\n', error)
      logFile.error(error)
    }
    process.on('uncaughtException', toLogFile)
    process.on('unhandledRejection:', toLogFile)

    const logsPath = path.join(global.CONSTANTS.APP_SUPPORT_PATH, 'logs')

    if (!fs.existsSync(logsPath)) fs.mkdirSync(logsPath)

    const now = new Date()
    const filePath = path.join(logsPath, `${now.toDateString() + ' @' + (() => {
      let hours = now.getHours()
      let minutes = now.getMinutes()

      hours < 10 && (hours = '0' + hours)
      minutes < 10 && (minutes = '0' + minutes)

      return hours + '-' + minutes
    })()}.log`)

    fs.closeSync(fs.openSync(filePath, 'w'))
    const access = fs.createWriteStream(filePath)

    process.env.ELECTRON_NO_ATTACH_CONSOLE = true
    process.stdout.write = process.stderr.write = access.write.bind(access)
  }

  if (process.env.NODE_ENV !== 'development') {
    global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
  }
})()

global.emptyFn = () => { }
