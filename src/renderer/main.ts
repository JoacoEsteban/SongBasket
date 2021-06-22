
import 'regenerator-runtime/runtime'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { setEnvironment, configureApp } from './environment'

const VueApp = new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>'
})

export default VueApp

setEnvironment()
configureApp()

VueApp.$mount('#app')
