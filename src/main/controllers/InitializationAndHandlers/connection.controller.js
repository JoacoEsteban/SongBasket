let CB
let API_CB
export default {
  init ({connectionChangeCallback, apiConnectionChangeCallback}) {
    CB = connectionChangeCallback || (() => {})
    API_CB = apiConnectionChangeCallback || (() => {})
    checkInternet()
    pingApi()
  }
}
const checkInternet = () => {
  require('dns').lookup('google.com', err => {
    const connected = !(err && err.code === 'ENOTFOUND')
    if (connected !== global.CONNECTED_TO_INTERNET) {
      global.CONNECTED_TO_INTERNET = connected
      CB(connected)
    }
    setTimeout(checkInternet, connected ? 10000 : 5000)
  })
}
const pingApi = async () => {
  let connected
  try {
    await require('axios').get(process.env.BACKEND + '/ping')
    connected = true
  } catch (err) {
    connected = false
  }
  if (global.CONNECTED_TO_API !== connected) (global.CONNECTED_TO_API = connected) + API_CB(connected)
  setTimeout(pingApi, global.CONSTANTS.HEROKU_PING_INTERVAL)
}
