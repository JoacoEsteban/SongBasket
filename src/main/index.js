import {logme} from '../UTILS'

import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
import * as sbFetch from './sbFetch'
// import '../renderer/store'
import store from '../renderer/store';
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

let mainWindow;
let loginWindow;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,

    minWidth: 800,
    minHeight: 500,
    useContentSize: true,
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createLoginWindow(){
  if(!loginWindow) //Prevents creating multiple loginWindows
  {

    loginWindow = new BrowserWindow({
      width: 550,
      height: 830,
      useContentSize: true,
    })
    
    loginWindow.loadURL(`${Backend}/init`, {"extraHeaders" : "pragma: no-cache\n"})
    
    loginWindow.on('closed', () => loginWindow = null  )


      //Gets user ID From backend
      session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => 
      {
        let user_id = details.responseHeaders.user_id;
        let success = details.responseHeaders.success; //if true close window and continue

        if(success == 'false') loginWindow.loadURL(`${Backend}/fail`, {"extraHeaders" : "pragma: no-cache\n"});


        if(user_id !== undefined && success == 'true')
        {
          USER_ID = user_id;
          console.log('id: ', USER_ID);

          
          //Gets playlist list from backend
          sbFetch.fetchPlaylists(USER_ID)
          .then((resolve) => storePlaylists(resolve));
        }else logme('FAILED TO AUTHORIZE')
        callback({ requestHeaders: details.requestHeaders })
      })
  }

};

function storePlaylists(resolve)
{
  console.log(resolve);
  store.dispatch('UPDATE_USER_N_PLAYLISTS', resolve)
  .then(() => mainWindow.webContents.send('playlists done') )

  if(loginWindow) loginWindow.close();
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






ipc.on('login', function(event){
  
  var useridtemp = true;
  //Gets user id from storage. IF NULL =>
  if(!useridtemp){
    createLoginWindow();
  }else{
    //ELSE init login and get user details =>
    sbFetch.fetchPlaylists('joaqo.esteban')
    .then(resolve => storePlaylists(resolve) );

    
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
