import dns from 'dns'
import axios from 'axios'

let CB
let API_CB
export default {
  init ({ connectionChangeCallback, apiConnectionChangeCallback }) {
    CB = connectionChangeCallback || (() => { })
    API_CB = apiConnectionChangeCallback || (() => { })
    checkInternet()
    pingApi()
  }
}
const checkInternet = () => {
  dns.lookup('youtube.com', err => {
    const connected = !(err && err.code === 'ENOTFOUND')
    if (connected !== global.CONNECTED_TO_INTERNET) {
      global.CONNECTED_TO_INTERNET = connected
      CB(connected)
    }
    // TODO set api as disconnected
    setTimeout(checkInternet, connected ? 10000 : 5000)
  })
}
const pingApi = async () => {
  let connected
  try {
    await axios.get(process.env.BACKEND + '/ping')
    connected = true
  } catch (err) {
    connected = false
  }
  if (global.CONNECTED_TO_API !== connected) (global.CONNECTED_TO_API = connected) + API_CB(connected)
  const time = global.CONNECTED_TO_API ? global.CONSTANTS.HEROKU_PING_INTERVAL : 5000
  setTimeout(pingApi, time)
}
