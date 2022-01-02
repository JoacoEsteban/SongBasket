import windowStateKeeper from 'electron-window-state'
import Positioner from 'electron-positioner'
import { BrowserWindow } from 'electron'

const windowController = {
  windowState: null,
  positioner: null,
  lockWindow (e, setSize = true) {
    const window = global.CONSTANTS.MAIN_WINDOW
    if (!window) return
    setSize && window.setSize(global.CONSTANTS.MAIN_WINDOW_CONFIG.width, global.CONSTANTS.MAIN_WINDOW_CONFIG.height)
    window.resizable = false
    windowController.positioner.move('center')
  },
  unlockWindow (e, setSize = true, setPosition = true) {
    const window = global.CONSTANTS.MAIN_WINDOW
    if (!window) return

    const windowState = windowController.windowState

    window.resizable = true
    setTimeout(() => {
      setSize && window.setSize(windowState.width, windowState.height)
      setPosition && windowState.x && windowState.y && window.setPosition(windowState.x, windowState.y, true)
      windowState.manage(window)
    }, 500)
  },
  onAppInit () {
    windowController.createMainWindow()
    global.CONSTANTS.LOADING_WINDOW?.close()
  },
  createMainWindow () {
    windowController.windowState = windowStateKeeper({
      defaultWidth: global.CONSTANTS.MAIN_WINDOW_CONFIG.width,
      defaultHeight: global.CONSTANTS.MAIN_WINDOW_CONFIG.height
    })
    const window = global.CONSTANTS.MAIN_WINDOW = new BrowserWindow({
      ...global.CONSTANTS.MAIN_WINDOW_CONFIG,
      width: global.CONSTANTS.MAIN_WINDOW_CONFIG.width,
      height: global.CONSTANTS.MAIN_WINDOW_CONFIG.height
    })
    window.setPositionSafe = window.setPosition
    window.setPosition = (x, y, animate = true) => window.setPositionSafe(x, y, animate)

    windowController.positioner = new Positioner(window)

    window.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)
    window.on('closed', () => {
      global.CONSTANTS.MAIN_WINDOW = null
      windowController.windowState = null
      windowController.positioner = null
    })
  },
  createLoadingWindow () {
    const window = global.CONSTANTS.LOADING_WINDOW = new BrowserWindow(global.CONSTANTS.LOADING_WINDOW_CONFIG)

    window.loadURL(process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`)
    window.on('closed', () => {
      global.CONSTANTS.LOADING_WINDOW = null
      // windowController.windowState = null
      // windowController.positioner = null
    })
  }
}

export default windowController
