import electron from 'electron'

// ---------------------DEFINE ENVIRONMENT---------------------
require('./environment-init')
// ---------------------LOAD DEPENDENCIES---------------------
require('./bootstrap')
// ffmpeg
// youtubedl

// ---------------------INITIALIZE RENDERER---------------------
// ---------------------SET IPC LISTENERS---------------------
// ---------------------SET IPC LISTENERS---------------------

// ---------------------INITIALIZE APPLICATION---------------------
require('./controllers/InitializationAndHandlers/handlers').init(electron)
require('./controllers/InitializationAndHandlers/ipc.routes').init(global.ipc = electron.ipcMain)
