let CB
export default {
  init ({connectionChangeCallback}) {
    CB = connectionChangeCallback
    checkInternet()
  }
}
const checkInternet = () => {
  require('dns').lookup('google.com', err => {
    const connected = !(err && err.code === 'ENOTFOUND')
    if (connected !== global.CONNECTED_TO_INTERNET) {
      global.CONNECTED_TO_INTERNET = connected
      CB(connected)
    }
    setTimeout(checkInternet, connected ? 5000 : 1000)
  })
}
