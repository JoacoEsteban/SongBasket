import windowStateKeeper from 'electron-window-state'
import Positioner from 'electron-positioner'

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
  createWindow () {
    windowController.windowState = windowStateKeeper({
      defaultWidth: global.CONSTANTS.MAIN_WINDOW_CONFIG.width,
      defaultHeight: global.CONSTANTS.MAIN_WINDOW_CONFIG.height
    })
    const window = global.CONSTANTS.MAIN_WINDOW = new global.CONSTANTS.BROWSER_WINDOW({
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
  }
}

export default windowController
