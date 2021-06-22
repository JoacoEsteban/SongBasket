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
import setIpcRoutes from './ipc.renderer.config'
import Vue, { VueConstructor } from 'vue'
import VueApp from '../main'

library.add(
  faArrowRight,
  faArrowLeft,
  faChevronUp
)

const VueProto: VueConstructor<Vue> = Vue

export function vueProtoConfig () {
  if (!process.env.IS_WEB) VueProto.use(require('vue-electron'))

  VueProto.config.productionTip = false

  VueProto.component('font-awesome-icon', FontAwesomeIcon)
}

export function vueAppConfig (): void {
  VueApp.$ = $
  VueApp.$uuid = uuidv4
  VueApp.$sleep = utils.sleep
  VueApp.$jsonClone = utils.jsonClone
  VueApp.$setRootVar = (key, val, valJs) => {
    $(':root')[0].style.setProperty('--' + key, val)
    window.ROOT_VARS[camelCase(key)] = valJs || val
  }

  VueApp.$ComponentRefs = {
    slides: {}
  }
  setControllers()
  setIpcRoutes()
  // -----sb-router-----
  console.log('aber', VueApp)
  // @ts-ignore
  window.VUEAPP = VueApp
  VueApp.$sbRouter = new SbRouter()
}

function setControllers () {
  VueApp.$controllers = {
    setup: require('../controllers/Setup.controller').default,
    core: require('../controllers/Core.controller').default,
    track: require('../controllers/Track.controller').default,
    playlist: require('../controllers/Playlist.controller').default,
    utils: require('../controllers/Utils.controller').default,
    modal: require('../controllers/Modal.controller').default
  }
}
