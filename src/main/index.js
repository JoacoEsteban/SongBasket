const electron = require('electron')
require('./environment-init')
const bootstrap = require('./bootstrap').default;
(async () => {
  await bootstrap(electron)
})()
