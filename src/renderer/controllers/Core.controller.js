let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const ipc = () => getVueInstance().$IPC
const uuid = () => getVueInstance().$uuid()
const CoreController = {
  queuePlaylist (id) {
    ipc().send('PLAYLISTS:QUEUE', id)
  },
  unsyncPlaylist (id) {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      ipc().once(listenerId, async (e, error) => {
        await getVueInstance().$store.dispatch('playlistUnsynced')
        error ? reject(error) : resolve()
      })
      ipc().send('PLAYLISTS:UNSYNC', {id, listenerId})
    })
  }
}

export default CoreController