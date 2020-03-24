import axios from 'axios'
import $ from 'jquery'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import SbRouter from './sbRouter'
import TrackController from './controllers/Track.controller'

library.add(faArrowRight, faArrowLeft)

const { BrowserWindow } = require('electron').remote
const GLOBAL = require('../main/Global/VARIABLES')

export default (Vue) => {
  // -----------------VUE-----------------

  if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

  Vue.http = Vue.prototype.$http = axios
  Vue.config.productionTip = false

  Vue.component('font-awesome-icon', FontAwesomeIcon)
  Vue.prototype.$ = $
  Vue.prototype.$sleep = (time) => new Promise((resolve, reject) => setTimeout(resolve, time))
  Vue.prototype.$setRootVar = (keys, val, valJs) => {
    $(':root')[0].style.setProperty('--' + keys.kebab, val)
    window.ROOT_VARS[keys.camel] = valJs || val
  }
  Vue.prototype.$camelcase = require('camelcase')
  Vue.prototype.$pascalcase = require('pascalcase')
  setControllers(Vue)
  // -----sb-router-----

  Vue.prototype.$sbRouter = new SbRouter()

  // -----------------WINDOW-----------------

  window.ROOT_VARS = {}
  window.$ = $
  $(window).on('mousedown', () => window.MOUSE_BEING_CLICKED = true)
  $(window).on('mouseup', () => window.MOUSE_BEING_CLICKED = false)
  window.ipc = require('electron').ipcRenderer

  let electronWindow

  const platform = GLOBAL.PLATFORM
  window.platform = platform

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
    electronWindow.isMaximized() ? electronWindow.unmaximize() : electronWindow.maximize()
  }
  window.toggleMaximization = toggleMaximization;

  (function () {
    function init () {
      var window = BrowserWindow.getFocusedWindow()
      electronWindow = window
      if (!window || !document.getElementById('min-btn')) return false
      document.getElementById('min-btn').addEventListener('click', function (e) {
        window.minimize()
      })
      if (!window || !document.getElementById('max-btn')) return false
      window.on('maximize', (e) => {
        document.getElementById('max-btn').classList.remove('button-maximize')
        document.getElementById('max-btn').classList.add('button-unmaximize')
      })
      window.on('unmaximize', (e) => {
        document.getElementById('max-btn').classList.remove('button-unmaximize')
        document.getElementById('max-btn').classList.add('button-maximize')
      })
      document.getElementById('max-btn').addEventListener('click', platform === 'mac' ? toggleFullscreen : toggleMaximization)

      if (!window || !document.getElementById('close-btn')) return false
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

function setControllers (Vue) {
  Vue.prototype.$controllers = {
    track: TrackController
  }
}
