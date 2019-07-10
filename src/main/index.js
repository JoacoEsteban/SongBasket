import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
import * as sbFetch from './sbFetch'
const ipc = electron.ipcMain

const localBackend = 'http://localhost:5000';
const herokuBackend = 'https://songbasket-backend.herokuapp.com';
const Backend = localBackend;

const filter = { //when logging in
  urls: ['http://*.localhost:5000/*']
}

var USER_ID = 'joaqo.esteban';

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 350,

    minWidth: 700,
    minHeight: 350,
    useContentSize: true,
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createLoginWindow(){
  let loginWindow = new BrowserWindow({
    height: 500,
    useContentSize: true,
    width: 500
  })
  
  loginWindow.loadURL(`${Backend}/init`)
  
  loginWindow.on('closed', () => {
    loginWindow = null
  })


    //Gets user ID From backend
    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => 
    {
      let user_id = details.responseHeaders.user_id;
      if(user_id !== undefined)
      {
        USER_ID = user_id;
        console.log('id: ', USER_ID);
  
        sbFetch.fetchPlaylists(USER_ID); //Gets plaulist list from backend
      }
      callback({ requestHeaders: details.requestHeaders })
    })
};





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






ipc.on('login', function(event){
  
  var useridtemp = false;
  //Gets user id from storage. IF NULL =>
  if(useridtemp){
    createLoginWindow();
  }else{
    //ELSE init login and get user details =>
    sbFetch.fetchPlaylists().then(function(resolve){ console.log(resolve); mainWindow.webContents.send('playlists done', resolve) });

    
  }
  
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
