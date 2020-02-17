import GLOBAL from '../Global/VARIABLES'
import * as handlers from './handlers'
import youtubeDl from '../FileSystem/youtube-dl'
import * as sbFetch from '../sbFetch'
import FileSystemUser from '../FileSystem/index'
import store from '../../renderer/store'
import * as youtubeHandler from '../youtubeHandler'

// :::::::::::::::::::::::::::::::::IPC:::::::::::::::::::::::::::::::::
export function init (ipc) {
  ipc.on('DOCUMENT_READY_CALLBACK', handlers.rendererMethods.documentReadyCallback)

  ipc.on('ytTrackDetails', function (event, ytId) {
    if (handlers.globalLoadingState().value) return
    handlers.LOADING(true, 'ytDetails')
    sbFetch.ytDetails(ytId)
      .then(resp => {
        console.log('YT Details retrieved', resp)
        event.sender.send('done', resp)
      })
      .catch(err => {
        console.error('EROR AT YTTRACKDETAILS:: ipc"ytTrackDetails"', err)
        event.sender.send('error')
      })
      .finally(() => {
        handlers.LOADING()
      })
  })

  ipc.on('download', function (event) {
    console.log('About to download')
    FileSystemUser.checkDownloadPaths()
      .then(playlists => {
        console.log('passed')
        youtubeDl.downloadSyncedPlaylists(playlists)
      })
  })

  ipc.on('openYtVideo', function (event, id) {
    require('open')('https://www.youtube.com/watch?v=' + id)
  })

  ipc.on('setHomeFolder', function () {
    handlers.setHomeFolder()
  })

  ipc.on('login', function () {
    handlers.createLoginWindow()
  })

  ipc.on('guestSignIn', function (event, { mode, query }) {
    console.log('Guest:: Type:', mode, query)
    if (mode === 'user') {
      if (query !== null && query !== undefined) {
        sbFetch.guestLogin(query)
          .then(resolve => {
            if (resolve.status === 404) {
              GLOBAL.MAIN_WINDOW.webContents.send('not-found')
            }
            if (resolve.status === 400) {
              GLOBAL.MAIN_WINDOW.webContents.send('invalid')
            }
            if (resolve.status === 200) {
              GLOBAL.MAIN_WINDOW.webContents.send('user-found', resolve)
            }
          })
          .catch(err => console.log(err))
      }
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

  ipc.on('refreshPlaylists', function (event) {
    handlers.guestFetch(store.getters.RequestParams.userId, false)
  })

  ipc.on('loadMore', function (event) {
    if (handlers.globalLoadingState().value) return
    console.log('LOADING MORE PLAYLISTS:::::::::')
    handlers.LOADING(true, 'morePlaylists')
    // gets user_id, SBID and Control object
    sbFetch.fetchPlaylists(store.getters.RequestParams)
      .then(resolve => {
        store.dispatch('updatePlaylists', resolve.playlists).then(() => {
          GLOBAL.MAIN_WINDOW.webContents.send('done loading')
        })
      })
      .catch(err => {
        console.error(err) // TODO Handle error
      })
      .finally(handlers.LOADING)
  })

  ipc.on('get tracks from', function (event, id) {
    if (handlers.globalLoadingState().value) return
    if (store.getters.PlaylistIsCached(id) === false && store.getters.PlaylistIsSynced(id) === false) {
      handlers.LOADING(true, 'playlistTracks')
      console.log('LOADING FROM ', id)
      handlers.fetchMultiple([{ id }], false)
        .then(() => {
          GLOBAL.MAIN_WINDOW.webContents.send('open playlist', id)
        })
        .catch(err => {
          console.error(222222222222222) // TODO Handle error
          console.error(err) // TODO Handle error
        })
        .finally(handlers.LOADING)
    } else GLOBAL.MAIN_WINDOW.webContents.send('open playlist', id)
  })

  ipc.on('Youtube Convert', function () {
    if (handlers.globalLoadingState().value) return
    if (store.state.CurrentUser.queuedPlaylists.length + store.state.CurrentUser.syncedPlaylists.length === 0) return

    console.log('FETCHING YT')
    let unCached = store.getters.UnCachedPlaylists
    console.log('unCached', unCached)
    if (unCached.length > 0) {
      handlers.LOADING(true, 'fetchPlaylists')
      handlers.fetchMultiple(unCached.map(pl => {
        return { id: pl }
      }), false)
        .then(() => {
          youtubeHandler.youtubizeAll()
        })
        .catch(err => {
          console.error('ERROR AT YoutubeConvert:: fetchMultiple', err)
        })
        .finally(() => {
          handlers.LOADING()
        })
    } else youtubeHandler.youtubizeAll()
  })
}
