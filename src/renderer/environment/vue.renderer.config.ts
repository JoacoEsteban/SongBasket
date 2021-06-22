import * as $ from 'jquery'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowRight,
  faArrowLeft,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { v4 as uuidv4 } from 'uuid'
import { camelCase } from 'change-case'
import * as utils from '../utils'
import SbRouter from './sbRouter'
import Vue, { VueConstructor } from 'vue'

library.add(
  faArrowRight,
  faArrowLeft,
  faChevronUp
)

const VueInstance: VueConstructor<Vue> = Vue

export default function () {
  if (!process.env.IS_WEB) VueInstance.use(require('vue-electron'))

  VueInstance.config.productionTip = false

  VueInstance.component('font-awesome-icon', FontAwesomeIcon)
  VueInstance.$ = $
  VueInstance.$uuid = uuidv4
  VueInstance.$sleep = utils.sleep
  VueInstance.$jsonClone = utils.jsonClone
  VueInstance.$setRootVar = (key, val, valJs) => {
    $(':root')[0].style.setProperty('--' + key, val)
    window.ROOT_VARS[camelCase(key)] = valJs || val
  }

  VueInstance.$ComponentRefs = {
    slides: {}
  }
  setControllers(VueInstance)
  require('./ipc.renderer.config').default(VueInstance)
  // -----sb-router-----
  VueInstance.$sbRouter = new SbRouter()
}

function setControllers (Vue) {
  Vue.prototype.$controllers = {
    setup: require('../controllers/Setup.controller').default,
    core: require('../controllers/Core.controller').default,
    track: require('../controllers/Track.controller').default,
    playlist: require('../controllers/Playlist.controller').default,
    utils: require('../controllers/Utils.controller').default,
    modal: require('../controllers/Modal.controller').default
  }
}
