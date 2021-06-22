import * as electron from 'electron'
import { VueConstructor } from 'vue'
import '../../main/controllers/Prototype/Array'
import '../../main/controllers/Prototype/Object'

import VueRendererConfig from './vue.renderer.config'
import WindowRendererConfig from './window.renderer.config'

const { BrowserWindow, getGlobal } = electron.remote

const GLOBAL = window.CONSTANTS = getGlobal('CONSTANTS')
console.log('gl', GLOBAL)

export default (Vue: VueConstructor) => {
  // -----------------PROTOTYPES-----------------
  // -----------------VUE-----------------
  VueRendererConfig()
  // -----------------WINDOW-----------------
  WindowRendererConfig()

  let electronWindow: electron.BrowserWindow | null

  const platform = GLOBAL.PLATFORM

  function toggleFullscreen () {
    let isFullscreen = false
    if (document.fullscreenElement) {
      isFullscreen = true
      document.exitFullscreen()
    } else document.documentElement.requestFullscreen()

    document.getElementById('max-btn')?.classList.remove('button-' + (isFullscreen ? 'un' : '') + 'maximize')
    document.getElementById('max-btn')?.classList.add('button-' + (!isFullscreen ? 'un' : '') + 'maximize')
  }
  window.toggleFullscreen = toggleFullscreen

  function toggleMaximization () {
    electronWindow && (electronWindow.isMaximized() ? electronWindow.unmaximize() : electronWindow.maximize())
  }
  window.toggleMaximization = toggleMaximization

  function init () {
    // TODO improve this logic
    const window = electronWindow = BrowserWindow.getFocusedWindow()

    const minBtn = document.getElementById('min-btn')
    const maxBtn = document.getElementById('max-btn')
    const closeBtn = document.getElementById('close-btn')

    if (!window || !minBtn || !maxBtn || !closeBtn) return false

    minBtn.addEventListener('click', function (e) {
      window.minimize()
    })
    window.on('maximize', () => {
      maxBtn.classList.remove('button-maximize')
      maxBtn.classList.add('button-unmaximize')
    })
    window.on('unmaximize', () => {
      maxBtn.classList.remove('button-unmaximize')
      maxBtn.classList.add('button-maximize')
    })
    maxBtn.addEventListener('click', platform === 'mac' ? toggleFullscreen : toggleMaximization)

    closeBtn.addEventListener('click', function (e) {
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
}
