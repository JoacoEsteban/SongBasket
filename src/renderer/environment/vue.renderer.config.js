import $ from 'jquery'

import axios from 'axios'
import { library } from '@fortawesome/fontawesome-svg-core'
import * as FontAwesome from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { v4 as uuidv4 } from 'uuid'
import * as utils from '../utils'
import SbRouter from './sbRouter'

const icons = [
  'faArrowRight',
  'faArrowLeft'
  // 'faLongArrowDown'
]
icons.forEach(icon => library.add(FontAwesome[icon]))

const camelCase = require('camelcase')

export default function (Vue) {
  if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

  Vue.http = Vue.prototype.$http = axios
  Vue.config.productionTip = false

  Vue.component('font-awesome-icon', FontAwesomeIcon)
  Vue.prototype.$ = $
  Vue.prototype.$uuid = uuidv4
  Vue.prototype.$sleep = utils.sleep
  Vue.prototype.$jsonClone = utils.jsonClone
  Vue.prototype.$setRootVar = (key, val, valJs) => {
    $(':root')[0].style.setProperty('--' + key, val)
    window.ROOT_VARS[camelCase(key)] = valJs || val
  }
  Vue.prototype.$constantcase = window.$constantcase = require('constant-case')
  Vue.prototype.$camelcase = camelCase
  Vue.prototype.$ComponentRefs = {
    slides: {}
  }
  setControllers(Vue)
  require('./ipc.renderer.config').default(Vue)
  // -----sb-router-----
  Vue.prototype.$sbRouter = new SbRouter()
}

function setControllers (Vue) {
  Vue.prototype.$controllers = {
    setup: require('../controllers/Setup.controller').default,
    core: require('../controllers/Core.controller').default,
    track: require('../controllers/Track.controller').default,
    playlist: require('../controllers/Playlist.controller').default,
    utils: require('../controllers/Utils.controller').default
  }
}
