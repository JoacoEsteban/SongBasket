import * as handlers from './handlers'
import * as sbFetch from './sbFetch'
import WindowController from './window.controller'
// import store from '../../../renderer/store/index.js'
import FileWatchers, { SBWatcherEvent } from '../FileSystem/FileWatchers'
import { ipcMain } from 'electron-better-ipc'

// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::
export default function () {
  const ipcSend = global.ipcSend
  const on = ipcMain.answerRenderer

  on('GET_STATUS', handlers.sendStatus)

  on('WINDOW:LOCK', WindowController.lockWindow)
  on('WINDOW:UNLOCK', WindowController.unlockWindow)

  on('YOUTUBE_DETAILS:GET', handlers.getYtTrackDetails)

  on('download', handlers.download)

  on('VIDEO:OPEN', handlers.openYtVideo)
  on('VIDEO:SEARCH', handlers.searchYtVideo)

  on('HOME_FOLDERS:ASK', handlers.askHomeFolder)
  on('HOME_FOLDER:SET', handlers.setHomeFolder)
  on('HOME_FOLDER:OPEN', handlers.openHomeFolder)

  on('LOGIN', handlers.login)

  on('LOGOUT', handlers.logout)

  // on('APP_UPDATE:CONFIRM', updater.handlers.onUserUpdateConfirmation)

  on('guestSignIn', function ({ mode, query }) { // TODO deprecate
    console.log('Guest:: Type:', mode, query)
    if (mode === 'user') {
      if (!query) return
      sbFetch.guestCheck(query)
        .then(resolve => {
          if (resolve.status === 404) {
            ipcSend('not-found')
          }
          if (resolve.status === 400) {
            ipcSend('invalid')
          }
          if (resolve.status === 200) {
            ipcSend('user-found', resolve)
          }
        })
        .catch(err => console.log(err))
    }
  })

  on('guestConfirm', async function (userID) { // TODO deprecate
    // Saving Home folder to .songbasket-userdata
    try {
      console.log(`Fetching Playlists from Guest user ${userID}`)
      handlers.guestFetch(userID, true)
    } catch (err) { throw err }
  })

  on('REFRESH', handlers.refresh)

  on('PLAYLISTS:LOAD_MORE', async () => {
    await handlers.loadMorePlaylists()
  })

  on('get tracks from', function (id) { // TODO deprecate
    console.log('wtf')
  })

  on('Youtube Convert', handlers.youtubize)

  on('PLAYLISTS:QUEUE', async function (id) {
    await handlers.queuePlaylist(id)
  })
  on('PLAYLISTS:UNSYNC', async function ({ id, listenerId }) {
    let error
    try {
      await handlers.unsyncPlaylist(id)
    } catch (err) {
      error = err
    } finally {
      event.sender.send(listenerId, error)
    }
  })

  on('PLAYLISTS:PAUSE', async function ({ id }) {
    await handlers.pausePlaylist(id)
  })

  on('TRACK:PAUSE', async function ({ id }) {
    await handlers.pauseTrack(id)
  })

  on('TRACK:CHANGE_SELECTION', async function ({ trackId, newId }) {
    await handlers.changeYtTrackSelection({ trackId, newId })
  })
  // FileWatchers
  // TODO turn into ipc promise

  on('FileWatchers:ASK_TRACKS', function () {
    ipcSend('FileWatchers:RETRIEVED_TRACKS', FileWatchers.retrieveTracks())
  })

  FileWatchers.on(SBWatcherEvent.ADDED, track => {
    ipcSend('FileWatchers:ADDED', track)
  })
  FileWatchers.on(SBWatcherEvent.REMOVED, track => {
    ipcSend('FileWatchers:REMOVED', track)
  })
}
