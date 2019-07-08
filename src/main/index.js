import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
const ipc = electron.ipcMain

// Modify the user agent for all requests to the following urls.
const filter = {
  urls: ['http://*.localhost:5000/*']
}



/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    let user = details.responseHeaders.user;
    if(user !== undefined)
    {

      console.log('user: ', user);
    }
    
    // details.requestHeaders['User-Agent'] = 'MyAgent'
    callback({ requestHeaders: details.requestHeaders })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


const localBackend = 'http://localhost:5000';
const herokuBackend = 'https://songbasket-backend.herokuapp.com';
const Backend = localBackend;




ipc.on('login', function(event){
  let loginWindow = new BrowserWindow({
    height: 500,
    useContentSize: true,
    width: 500
  })
  
  loginWindow.loadURL(`${Backend}/init`)
  
  loginWindow.webContents.on('will-navigate', function (event, newUrl) {
    console.log('New URL: ', newUrl)

  })

  
  
  
  // loginWindow.webContents.on('did-finish-load', () =>
  // {
    //   loginWindow.webContents.executeJavaScript('console.log(document.documentElement.innerHTML);')
    
    // })
    
    loginWindow.on('closed', () => {
      loginWindow = null
    })
  })
  























/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
