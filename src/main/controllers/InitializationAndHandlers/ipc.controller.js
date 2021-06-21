import { ipcMain } from 'electron-better-ipc'

const w = () => global.CONSTANTS.MAIN_WINDOW

const IpcController = {
  send (...args) {
    if (!w()) return // throw new Error('Main window does\'nt exist')
    return ipcMain.callFocusedRenderer(...args)
  },
  once (...args) {
    global.ipc.once(...args)
  }
}

export default IpcController
