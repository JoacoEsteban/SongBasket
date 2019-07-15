import {logme} from '../UTILS'

import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
import * as sbFetch from './sbFetch'
import store from '../renderer/store';
const ipc = electron.ipcMain

const localBackend = 'http://localhost:5000';
const herokuBackend = 'https://songbasket-backend.herokuapp.com';
const Backend = localBackend;

const filter = { //when logging in
  urls: ['http://*.localhost:5000/*']
}

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
    
    //user logs into spotify and backend retrieves access tokens
    loginWindow.loadURL(`${Backend}/init`, {"extraHeaders" : "pragma: no-cache\n"})
    
    loginWindow.on('closed', () => loginWindow = null  )


    //Then, Backend retrieves user data and sends it back with a unique SBID
    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => 
    {
      let user_id = details.responseHeaders.user_id;
      let SBID = details.responseHeaders.SBID;
      let success = details.responseHeaders.success; //if true close window and continue

      logme(SBID);
      logme(success);


      if(SBID !== undefined && success == 'true')
      {
        //Gets playlist list from backend and stores them in vuex
        sbFetch.fetchPlaylists({user_id: user_id, logged: true, SBID: SBID, control:{offset: 0}})
        .then((resolve) => storePlaylists(resolve));

      }else logme('FAILED TO AUTHORIZE')

      callback({ requestHeaders: details.requestHeaders })
    })
  }

};

function storePlaylists(resolve)
{
  store.dispatch('INIT_USER', resolve)
  .then(() => 
  {
    mainWindow.webContents.send('playlists done');
    mainWindow.webContents.send(`hola ${store.state.CurrentUser.playlists[0].id}`);
    if(loginWindow) loginWindow.close();
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




// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::

ipc.on('login', function(event){

  var useridtemp = null;
  var guest = true;

  //Gets user id from storage. IF NULL =>
  if(!useridtemp){
    createLoginWindow();
  }else{
    //ELSE init login and get user details =>
    sbFetch.fetchPlaylists('joaqo.esteban')
    .then(resolve => storePlaylists(resolve) );

    
  }
  
})

ipc.on('guestSearch', function(event, { userQuery }){
  logme(`Searching Guest user ${userQuery}`)

  sbFetch.fetchPlaylists({user_id: userQuery, logged: false, SBID: null, control:{offset: 0}})
  .then(resolve => {
    logme(resolve)
    if(resolve.code == 404)
    {
      mainWindow.webContents.send('not-found');
    }else{
      storePlaylists(resolve)
    }
  } );

    
})


ipc.on('loadMore', function(event)
{
  logme('LOADING MORE:::::::::');
  
  //gets user_id, SBID and Control object
  sbFetch.fetchPlaylists( store.getters.getMorePlaylistsData )
  .then(resolve => 
  {
    store.dispatch('UPDATE_PLAYLISTS', resolve.playlists).then(resgaudio => 
    {
      mainWindow.webContents.send('done loading');
    })
  })
})

ipc.on('get tracks from', function(event, id)
{
  console.log('LOADING FROM ', id, );
  // sbFetch.getTracks()
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
