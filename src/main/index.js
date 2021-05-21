import electron from 'electron'
import './environment-init'
import bootstrap from './bootstrap'

(async () => {
  await bootstrap(electron)
})()
