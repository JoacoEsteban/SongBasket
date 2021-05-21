import electron from 'electron'
import '../../main/controllers/Prototype/Array'
import '../../main/controllers/Prototype/Object'

import VueRendererConfig from './vue.renderer.config'
import WindowRendererConfig from './window.renderer.config'

const { BrowserWindow, getGlobal } = electron.remote

const GLOBAL = window.CONSTANTS = getGlobal('CONSTANTS')
console.log('gl', GLOBAL)

export default (Vue) => {
  // -----------------PROTOTYPES-----------------
  // -----------------VUE-----------------
  VueRendererConfig(Vue)
  // -----------------WINDOW-----------------
  WindowRendererConfig(window)

  let electronWindow

  const platform = GLOBAL.PLATFORM

  function toggleFullscreen () {
    let isFullscreen = false
    if (document.webkitFullscreenElement) {
      isFullscreen = true
      document.webkitExitFullscreen()
    } else document.documentElement.webkitRequestFullscreen()

    document.getElementById('max-btn').classList.remove('button-' + (isFullscreen ? 'un' : '') + 'maximize')
    document.getElementById('max-btn').classList.add('button-' + (!isFullscreen ? 'un' : '') + 'maximize')
  }
  window.toggleFullscreen = toggleFullscreen

  function toggleMaximization () {
    electronWindow && (electronWindow.isMaximized() ? electronWindow.unmaximize() : electronWindow.maximize())
  }
  window.toggleMaximization = toggleMaximization;

  (function () {
    function init () {
      // TODO improve this logic
      const window = electronWindow = BrowserWindow.getFocusedWindow()
      if (!window || !document.getElementById('min-btn') || !document.getElementById('max-btn') || !document.getElementById('close-btn')) return false
      document.getElementById('min-btn').addEventListener('click', function (e) {
        window.minimize()
      })
      window.on('maximize', (e) => {
        document.getElementById('max-btn').classList.remove('button-maximize')
        document.getElementById('max-btn').classList.add('button-unmaximize')
      })
      window.on('unmaximize', (e) => {
        document.getElementById('max-btn').classList.remove('button-unmaximize')
        document.getElementById('max-btn').classList.add('button-maximize')
      })
      document.getElementById('max-btn').addEventListener('click', platform === 'mac' ? toggleFullscreen : toggleMaximization)

      document.getElementById('close-btn').addEventListener('click', function (e) {
        window.close()
      })
      return true
    }

    document.onreadystatechange = function () {
      const loop = () => {
        if (!init()) setTimeout(loop, 1000)
      }
      if (document.readyState === 'complete') {
        loop()
      }
    }
  })()
}
