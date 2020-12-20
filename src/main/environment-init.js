(r => r.keys().forEach(r))(require.context('./controllers/Prototype', true, /\.js$/))

require('./Global/core.CONSTANTS')

const PROD = global.CONSTANTS.ENV_PROD

const util = require('util')
const child_process = require('child_process')
const youtubeDl = require('youtube-dl')
PROD && youtubeDl.setYtdlBinary(youtubeDl.getYtdlBinary().replace('app.asar', 'app.asar.unpacked'))

const USE_PROD_BACKEND = true;
(() => {
  const subDomain = 'api'
  process.env.BACKEND = PROD || USE_PROD_BACKEND ? ('https://' + subDomain + '.songbasket.com') : 'http://localhost:5000'
  global.log = (...aa) => aa.forEach(a => console.log(util.inspect(a, { showHidden: false, depth: null })))
})()

global.flushYtDlCache = async () => {
  return new Promise((resolve, reject) => {
    child_process.exec(youtubeDl.getYtdlBinary() + ' --rm-cache-dir', (err, out) => {
      if (err) {
        console.error('Error flushding ytdl cache', err)
        return reject(err)
      }
      resolve(out)
    })
  })
}

global.flushYtDlCache().catch(global.emptyFn)

const CATCH_TO_FILE = false
const logFile = require('electron-log');
(function setErrorHandling () {
  if (PROD || CATCH_TO_FILE) {
    console.log = console.info
    const toLogFile = error => {
      console.error('----------UNCAUGHT----------\n', error)
      logFile.error(error)
    }
    process.on('uncaughtException', toLogFile)
    process.on('unhandledRejection:', toLogFile)

    const fs = require('fs')
    const path = require('path')

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
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
  }
})()

global.emptyFn = () => { }
