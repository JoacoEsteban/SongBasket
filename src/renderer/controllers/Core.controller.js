let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const ipc = () => getVueInstance().$IPC
const CoreController = {
  queuePlaylist (id) {
    ipc().send('PLAYLISTS:QUEUE', id)
  }
}

export default CoreController
