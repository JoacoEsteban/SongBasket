const { autoUpdater } = require('electron-updater')
const init = async () => {
  try {
    autoUpdater.onUpdateAvailable(autoUpdater.quitAndInstall)
    await autoUpdater.checkForUpdatesAndNotify()
  } catch (error) {
    console.error('UPDATE FAILED', error)
  }
}

init()
