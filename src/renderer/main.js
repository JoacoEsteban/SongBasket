import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'

require('./environment').default(Vue)

export default new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
