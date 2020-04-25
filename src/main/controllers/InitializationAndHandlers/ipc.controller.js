const w = () => global.CONSTANTS.MAIN_WINDOW

const IpcController = {
  send (...args) {
    w().webContents.send(...args)
  },
  once (...args) {
    global.ipc.once(...args)
  }
}

export default IpcController
