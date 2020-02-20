import Vue from 'vue'
import axios from 'axios'
import $ from 'jquery'

import App from './App'
import router from './router'
import store from './store'
const { BrowserWindow } = require('electron').remote

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
window.$ = $
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
window.ipc = require('electron').ipcRenderer

let electronWindow

const platform = (() => {
  switch (process.platform) {
    case 'darwin':
      return 'mac'
    default:
      if (process.platform.includes('win')) return 'windows'
      return 'other'
  }
})()
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

new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
