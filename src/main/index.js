import electron from 'electron'

require('./environment-init')
require('./controllers/InitializationAndHandlers/handlers').init(electron)
require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)
