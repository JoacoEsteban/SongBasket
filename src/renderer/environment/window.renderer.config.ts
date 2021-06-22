import * as $ from 'jquery'
import vue from '../controllers/VueInstance'
import * as changeCase from 'change-case'

window.SHOW_KEYCODES = false

export default function () {
  $(window).on('mousewheel', invalidatePlTransformCache)
  $(window).on('resize', invalidatePlTransformCache)

  $(window).on('keydown', handleWindowKey)
  $(window).on('mousedown', handleMouseKey)

  window.ROOT_VARS = {}
  window.$ = $
  window.changeCase = changeCase
  $(window).on('mousedown', () => window.MOUSE_BEING_CLICKED = true)
  $(window).on('mouseup', () => window.MOUSE_BEING_CLICKED = false)
  $(window).on('dblclick', checkToggleMaximization)
}

function checkToggleMaximization (e) {
  $(e.target).css('-webkit-app-region') === 'drag' && window.toggleMaximization()
}

function invalidatePlTransformCache () {
  vue.root.cardTransformInvalidation = Date.now()
}

function handleMetaKeyCombo (keyCode, e) {
  const { shiftKey } = e
  switch (keyCode) {
    case 219:
      vue.sbRouter.goBack()
      break
    case 221:
      vue.sbRouter.goForward()
      break
    case 68:
      (shiftKey && vue.controllers.core.download((() => {
        const path = vue.sbRouter.giveMeCurrent()
        return path.name === 'playlist-view' && path.params.id
      })())) + vue.sbRouter.push({ name: 'downloads-view' })
      break
    case 82:
      shiftKey && (vue.controllers.core.refresh() + (e && e.preventDefault()))
      break
    case 80:
      (vue.sbRouter.push({ name: 'home', params: { which: 'playlists-list' } }) + (e && e.preventDefault()))
      break
    case 84:
      (vue.sbRouter.push({ name: 'home', params: { which: 'tracks-list' } }) + (e && e.preventDefault()))
      break
    case 191:
      window.CONSTANTS.IS_DEV && $('html').toggleClass('debug-outlines')
      break
    default:
  }
}
function isCommandKey (meta: boolean, control: boolean) {
  if (window.CONSTANTS.PLATFORM === 'mac') return meta
  return control
}

// eslint-disable-next-line no-undef
function handleWindowKey (e: JQueryEventObject) {
  const { keyCode, metaKey, ctrlKey } = e
  if (window.SHOW_KEYCODES) console.log(keyCode)
  if (isCommandKey(metaKey, ctrlKey) && keyCode !== 8) return handleMetaKeyCombo(keyCode, e)
  if (isAscii(keyCode) || (keyCode === 8 && vue.root.searchInputElement && vue.root.searchInputElement.value.length)) return focusSearchbar()
}
function focusSearchbar () {
  vue.root.searchInputElement && vue.root.searchInputElement.focus()
}

// eslint-disable-next-line no-undef
function handleMouseKey (e: JQueryEventObject) {
  const { button } = e
  switch (button) {
    case 3:
      vue.sbRouter.goBack()
      break
    case 4:
      vue.sbRouter.goForward()
      break
  }
}

function isAscii (code: number) {
  return code >= 48 && code <= 90
}
