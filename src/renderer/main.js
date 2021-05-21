import 'regenerator-runtime/runtime'
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import setEnvironment from './environment'

setEnvironment(Vue)

export default global.VUE_ROOT = new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
