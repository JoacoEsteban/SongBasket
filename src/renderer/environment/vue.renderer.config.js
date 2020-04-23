import $ from 'jquery'

import axios from 'axios'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import * as utils from '../utils'
import SbRouter from './sbRouter'

library.add(faArrowRight, faArrowLeft)

export default function (Vue) {
  if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

  Vue.http = Vue.prototype.$http = axios
  Vue.config.productionTip = false

  Vue.component('font-awesome-icon', FontAwesomeIcon)
  Vue.prototype.$ = $
  Vue.prototype.$sleep = utils.sleep
  Vue.prototype.$setRootVar = (keys, val, valJs) => {
    $(':root')[0].style.setProperty('--' + keys.kebab, val)
    window.ROOT_VARS[keys.camel] = valJs || val
  }
  Vue.prototype.$camelcase = require('camelcase')
  Vue.prototype.$pascalcase = require('pascalcase')
  setControllers(Vue)
  require('./ipc.renderer.config').default(Vue)
  // -----sb-router-----
  Vue.prototype.$sbRouter = new SbRouter()
}

function setControllers (Vue) {
  Vue.prototype.$controllers = {
    core: require('../controllers/Core.controller').default,
    track: require('../controllers/Track.controller').default
  }
}
