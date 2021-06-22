// import Vue from 'vue'
type changeCaseFn = (value: string) => string | boolean

declare interface Window {
  $: JQueryStatic,
  CONSTANTS: any, // TODO
  toggleFullscreen: () => void,
  toggleMaximization: () => void,
  ROOT_VARS: {
    [key: string]: any
  },
  MOUSE_BEING_CLICKED: boolean,
  SHOW_KEYCODES: boolean,
  ROOT: Vue,
  sbDebug: Vue,
  VUE_HAS_MOUNTED: boolean,
  changeCase: {
    'noCase': changeCaseFn,
    'dotCase': changeCaseFn,
    'swapCase': changeCaseFn,
    'pathCase': changeCaseFn,
    'upperCase': changeCaseFn,
    'lowerCase': changeCaseFn,
    'camelCase': changeCaseFn,
    'snakeCase': changeCaseFn,
    'titleCase': changeCaseFn,
    'paramCase': changeCaseFn,
    'headerCase': changeCaseFn,
    'pascalCase': changeCaseFn,
    'constantCase': changeCaseFn,
    'sentenceCase': changeCaseFn,
    'isUpperCase': changeCaseFn,
    'isLowerCase': changeCaseFn,
    'upperCaseFirst': changeCaseFn,
    'lowerCaseFirst': changeCaseFn,
  }
  // VUEX:
}
