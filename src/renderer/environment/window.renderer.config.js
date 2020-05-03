import $ from 'jquery'

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
}

function invalidatePlTransformCache () {
  thisVue().$root.plTransformInvalidation = Date.now()
}

function handleMetaKeyCombo (keyCode) {
  switch (keyCode) {
    case 219:
      return thisVue().$sbRouter.goBack()
    case 221:
      return thisVue().$sbRouter.goForward()
    case 68:
      return thisVue().$sbRouter.push({name: 'downloads-view'})
    default:
  }
}
function isCommandKey (meta, control) {
  if (global.CONSTANTS.PLATFORM === 'mac') return meta
  return control
}
function handleWindowKey (e) {
  const {keyCode, metaKey, ctrlKey} = e
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
