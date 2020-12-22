const electron = require('electron')

require('./environment-init')
console.log('bebebe')
const bootstrap = require('./bootstrap').default
console.log(bootstrap);
(async () => {
  // ---------------------DEFINE ENVIRONMENT---------------------
  // ---------------------LOAD DEPENDENCIES---------------------
  console.log('before')
  await bootstrap(electron)
  console.log('after')
  // ---------------------INITIALIZE RENDERER---------------------
  // ---------------------SET IPC LISTENERS---------------------
  // ---------------------SET IPC LISTENERS---------------------

  // ---------------------INITIALIZE APPLICATION---------------------
  require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)
})()
