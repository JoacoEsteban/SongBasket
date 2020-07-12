import $ from 'jquery'

window.SHOW_KEYCODES = false

let VueInstance
const thisVue = () => (VueInstance || (VueInstance = require('../main').default))
export default function (window) {
  $(window).on('mousewheel', invalidatePlTransformCache)
  $(window).on('resize', invalidatePlTransformCache)

  $(window).on('keydown', handleWindowKey)
  $(window).on('mousedown', handleMouseKey)

  window.ROOT_VARS = {}
  window.$ = $
  $(window).on('mousedown', () => window.MOUSE_BEING_CLICKED = true)
  $(window).on('mouseup', () => window.MOUSE_BEING_CLICKED = false)
  $(window).on('dblclick', toggleMaximization)
}

function toggleMaximization (e) {
  console.log($(e.target).css('-webkit-app-region'))
  $(e.target).css('-webkit-app-region') === 'drag' && window.toggleMaximization()
}

function invalidatePlTransformCache () {
  thisVue().$root.cardTransformInvalidation = Date.now()
}

function handleMetaKeyCombo (keyCode, e) {
  const {shiftKey} = e
  switch (keyCode) {
    case 219:
      thisVue().$sbRouter.goBack()
      break
    case 221:
      thisVue().$sbRouter.goForward()
      break
    case 68:
      (shiftKey && thisVue().$controllers.core.download((() => {
        const path = thisVue().$sbRouter.giveMeCurrent()
        return path.name === 'playlist-view' && path.params.id
      })())) + thisVue().$sbRouter.push({name: 'downloads-view'})
      break
    case 82:
      shiftKey && (thisVue().$controllers.core.refresh() + (e && e.preventDefault()))
      break
    case 80:
      (thisVue().$sbRouter.push({name: 'home', params: {which: 'playlists-list'}}) + (e && e.preventDefault()))
      break
    case 84:
      (thisVue().$sbRouter.push({name: 'home', params: {which: 'tracks-list'}}) + (e && e.preventDefault()))
      break
    default:
  }
}
function isCommandKey (meta, control) {
  if (window.CONSTANTS.PLATFORM === 'mac') return meta
  return control
}
function handleWindowKey (e) {
  const {keyCode, metaKey, ctrlKey} = e
  if (window.SHOW_KEYCODES) console.log(keyCode)
  if (isCommandKey(metaKey, ctrlKey) && keyCode !== 8) return handleMetaKeyCombo(keyCode, e)
  if (isAscii(keyCode) || (keyCode === 8 && thisVue().$root.searchInputElement && thisVue().$root.searchInputElement.value.length)) return focusSearchbar()
}
function focusSearchbar () {
  thisVue().$root.searchInputElement && thisVue().$root.searchInputElement.focus()
}
function handleMouseKey ({button}) {
  switch (button) {
    case 3:
      thisVue().$sbRouter.goBack()
      break
    case 4:
      thisVue().$sbRouter.goForward()
      break
  }
}
function isAscii (code) {
  return code >= 48 && code <= 90
}
