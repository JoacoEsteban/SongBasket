import * as handlers from './handlers'
import * as sbFetch from './sbFetch'
import WindowController from './window.controller'
// import store from '../../../renderer/store/index.js'
import FileWatchers, { SBWatcherEvent } from '../FileSystem/FileWatchers'
import { ipcMain } from 'electron-better-ipc'
import { SpotifyPlaylistId } from '../../../@types/Spotify'

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

  on('REFRESH', handlers.refresh)

  on('PLAYLISTS:LOAD_MORE', async () => {
    await handlers.loadMorePlaylists()
  })

  on('get tracks from', function (id) { // TODO deprecate
    console.log('wtf')
  })

  on('Youtube Convert', handlers.youtubize)

  on('PLAYLISTS:QUEUE', async function (id: SpotifyPlaylistId) {
    await handlers.queuePlaylist(id)
  })
  on('PLAYLISTS:UNSYNC', async function ({ id }: { id: SpotifyPlaylistId }) {
    await handlers.unsyncPlaylist(id)
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
