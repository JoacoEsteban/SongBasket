import GLOBAL from '../../Global/VARIABLES'

const w = () => GLOBAL.MAIN_WINDOW

const IpcController = {
  send (...args) {
    w().webContents.send(...args)
  }
}

export default IpcController
