import { ipcMain } from 'electron-better-ipc'

const w = () => global.CONSTANTS.MAIN_WINDOW

const IpcController = {
  send (...args: any) {
    const window = w()
    if (!window) return // throw new Error('Main window does\'nt exist')
    return ipcMain.callRenderer(window, args[0], args[1])
  }
}

export default IpcController
