import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
const customTitlebar = require('custom-electron-titlebar')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')

/* eslint-disable no-unused-vars */
let titlebar
function createTitleBar () {
  titlebar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#333')
  })

  document.documentElement.style.setProperty('--max-container-height', 'calc(100vh - ' + document.querySelector('.titlebar').offsetHeight + 'px)')
}

createTitleBar()
