import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
const { BrowserWindow } = require('electron').remote

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false;

(function () {
  function init () {
    var window = BrowserWindow.getFocusedWindow()
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
    document.getElementById('max-btn').addEventListener('click', function (e) {
      if (window.isMaximized()) window.unmaximize()
      else window.maximize()
    })

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

window.platform = (() => {
  switch (process.platform) {
    case 'darwin':
      return 'mac'
    default:
      if (process.platform.includes('win')) return 'windows'
      return 'other'
  }
})()
