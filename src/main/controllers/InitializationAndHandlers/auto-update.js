import * as handlers from './handlers'

const { autoUpdater } = require('electron-updater')
const FLAGS = global.CONSTANTS.APP_STATUS.UPDATES

function init () {
  setEventListeners()
}

function resetFlags () {
  FLAGS.updateError = null
  FLAGS.updateAvailable = false
  FLAGS.updateVersion = null
  FLAGS.downloadInProgress = false
  FLAGS.downloadPtg = null
  FLAGS.updateDownloaded = false
}

const setEventListeners = async () => {
  try {
    console.log('SETTING AUTO-UPDATE EVENT HANDLERS')
    autoUpdater.on('error', onError)
    autoUpdater.on('checking-for-update', onCheckingForUpdate)
    autoUpdater.on('update-available', onUpdateAvailable)
    autoUpdater.on('update-not-available', onUpdateNotAvailable)
    autoUpdater.on('download-progress', onDownloadProgress)
    autoUpdater.on('update-downloaded', onUpdateDownloaded)

    await autoUpdater.checkForUpdatesAndNotify()
  } catch (error) {
    console.error('UPDATE FAILED', error)
  }
}

const onError = error => {
  console.error('ERROR UPDATING', error)
  FLAGS.updateError = error
}

const onCheckingForUpdate = () => {
  console.log('checking for update')
  resetFlags()
}
const onUpdateAvailable = info => {
  console.log('update available')
  FLAGS.updateAvailable = true
  FLAGS.updateVersion = info.version
}
const onUpdateNotAvailable = info => {
  resetFlags()
  console.log('update NOT available')
}
const onDownloadProgress = progressObj => {
  FLAGS.downloadInProgress = true
  FLAGS.updatePtg = progressObj.percent
}
const onUpdateDownloaded = async info => {
  FLAGS.downloadInProgress = false
  FLAGS.updateDownloaded = true
  FLAGS.updatePtg = 100

  // ipcSend('READY_TO_UPDATE', FLAGS)
  const message = `Version ${FLAGS.updateVersion} has been downloaded\nDo you want to install it now?`
  const res = await global.CONSTANTS.DIALOG.showMessageBox(global.CONSTANTS.MAIN_WINDOW, {message, buttons: ['Yes', 'No', 'See changelog']})
  console.log(res)
  switch (res.response) {
    case 0:
      // Yes
      onUserUpdateConfirmation()
      break
    case 1:
      // No
      break
    case 2:
      // See changelog
      handlers.showChangelog()
      break
  }
}

const onUserUpdateConfirmation = () => {
  if (global.CONSTANTS.IS_DEV) return console.log('Not updating on dev')
  FLAGS.updateAvailable && FLAGS.updateDownloaded && autoUpdater.quitAndInstall()
}

const updateHandlers = {
  onUserUpdateConfirmation
}

export default {
  init,
  handlers: updateHandlers
}
