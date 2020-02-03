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
    document.getElementById('min-btn').addEventListener('click', function (e) {
      var window = BrowserWindow.getFocusedWindow()
      window.minimize()
    })
    console.log(document.getElementById('max-btn'))
    document.getElementById('max-btn').addEventListener('click', function (e) {
      var window = BrowserWindow.getFocusedWindow()
      window.maximize()
    })

    document.getElementById('close-btn').addEventListener('click', function (e) {
      var window = BrowserWindow.getFocusedWindow()
      window.close()
    })
  }

  document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
      init()
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

/* eslint-disable no-unused-vars */
// console.log(customTitlebar.Themebar.mac)
// let titlebar
// let isMac = process.platform === 'darwin'

// function createTitleBar () {
//   titlebar = new customTitlebar.Titlebar({
//     backgroundColor: customTitlebar.Color.fromHex('#333'),
//     iconsTheme: customTitlebar.Themebar[isMac ? 'mac' : 'win'],
//     titleHorizontalAlignment: 'right',
//     order: isMac ? 'inverted' : null,
//     unfocusEffect: false
//   })

//   document.documentElement.style.setProperty('--max-container-height', 'calc(100vh - ' + document.querySelector('.titlebar').offsetHeight + 'px)')
// }

// createTitleBar()
