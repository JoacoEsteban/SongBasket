// import GLOBAL from '../../Global/VARIABLES'
import * as handlers from './handlers'
import * as sbFetch from './sbFetch'
import store from '../../../renderer/store'
import FileWatchers from '../FileSystem/FileWatchers'
import IpcController from './ipc.controller'

const ipcSend = IpcController.send

// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::
export function init (ipc = global.ipc) {
  if (!ipc) throw new Error('IPC OBJECT NOT PROVIDED @ ipc.routes.init')

  ipc.on('DOCUMENT_READY_CALLBACK', handlers.rendererMethods.documentReadyCallback)

  ipc.on('ytTrackDetails', handlers.getYtTrackDetails)

  ipc.on('download', handlers.download)

  ipc.on('openYtVideo', handlers.openYtVideo)

  ipc.on('setHomeFolder', handlers.setHomeFolder)

  ipc.on('login', handlers.createLoginWindow)

  ipc.on('guestSignIn', function (event, { mode, query }) {
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
    if (mode === 'playlist') {
      // TODO delete this
      sbFetch.getTracks(store.getters.RequestParams, { id: query }, false)
        .then(response => {
          console.log('responseta', response)
          if (response.error) {
            console.log('ERROR DUD', response)
          } else {
            console.log('DOUU', response)
          }
          // store.dispatch('playlistStoreTracks', response.playlist).then(() => {
          //   count--
          //   if (count === 0) resolve()
          // })
        })
        .catch(error => {
          console.log('a ver si lo aachea', error)
        })
    }
  })

  ipc.on('guestConfirm', async function (event, userID) {
    // Saving Home folder to .songbasket-userdata
    try {
      console.log(`Fetching Playlists from Guest user ${userID}`)
      handlers.guestFetch(userID, true)
    } catch (err) { throw err }
  })

  ipc.on('refreshPlaylists', handlers.refresh)

  ipc.on('loadMore', function (event) {
    if (handlers.globalLoadingState().value) return
    console.log('LOADING MORE PLAYLISTS:::::::::')
    handlers.LOADING(true, 'morePlaylists')
    // gets user_id, SBID and Control object
    sbFetch.fetchPlaylists(store.getters.RequestParams)
      .then(resolve => {
        store.dispatch('updatePlaylists', resolve.playlists).then(() => {
          ipcSend('done loading')
        })
      })
      .catch(err => {
        console.error(err) // TODO Handle error
      })
      .finally(handlers.LOADING)
  })

  ipc.on('get tracks from', function (event, id) {
    console.log('wtf')
  })

  ipc.on('Youtube Convert', handlers.youtubize)

  ipc.on('PLAYLISTS:QUEUE', function (event, id) {
    handlers.queuePlaylist(id)
  })
  ipc.on('PLAYLISTS:UNSYNC', async function (event, {id, listenerId}) {
    let error
    try {
      await handlers.unsyncPlaylist(id)
    } catch (err) {
      error = err
    }
    event.sender.send(listenerId, error)
  })
  // FileWatchers

  ipc.on('FileWatchers:ASK_TRACKS', function () {
    console.log('beforeask')
    ipcSend('FileWatchers:RETRIEVED_TRACKS', FileWatchers.retrieveTracks())
  })

  FileWatchers.on('added', track => {
    ipcSend('FileWatchers:ADDED', track)
  })
  FileWatchers.on('removed', track => {
    ipcSend('FileWatchers:REMOVED', track)
  })
}
