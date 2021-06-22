import Vue from 'vue'
import SbRouter from '../renderer/environment/sbRouter'

type shared = {
  $: JQueryStatic,
  $uuid: uuidv4,
  $sleep: (time: number) => Promise<void>,
  $jsonClone: (obj: {}) => {},
  $setRootVar: (key: string, val: any, valJs: any) => void
}

declare module 'vue/types/vue' {
  interface Vue extends shared {
    DOWNLOADED_TRACKS: {},
    SEARCH_INPUT: {
      writeEvent: boolean,
      value: string
    },
    $sbRouter: SbRouter,
    cardTransformInvalidation: number,
    OPEN_MODAL: () => void
  }

  interface VueConstructor extends shared { }
}