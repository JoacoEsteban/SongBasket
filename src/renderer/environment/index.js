const { BrowserWindow } = require('electron').remote
const GLOBAL = window.CONSTANTS = require('electron').remote.getGlobal('CONSTANTS')
console.log('gl', GLOBAL)
export default (Vue) => {
  // -----------------PROTOTYPES-----------------
  require('../../main/controllers/Prototype/Array')
  require('../../main/controllers/Prototype/Object')
  // -----------------VUE-----------------
  require('./vue.renderer.config').default(Vue)
  // -----------------WINDOW-----------------
  require('./window.renderer.config').default(window)

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
  window.toggleMaximization = toggleMaximization

  ;(function () {
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
