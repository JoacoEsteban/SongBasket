import * as dns from 'dns'
import axios from 'axios'

let CB: (connected: boolean) => void
let API_CB: (connected: boolean) => void

export default {
  init (params: { connectionChangeCallback: typeof CB, apiConnectionChangeCallback: typeof API_CB }) {
    const { connectionChangeCallback, apiConnectionChangeCallback } = params
    CB = connectionChangeCallback || (() => {})
    API_CB = apiConnectionChangeCallback || (() => {})
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
  if (global.CONNECTED_TO_API !== connected) {
    global.CONNECTED_TO_API = connected
    API_CB(connected)
  }
  const time: number = global.CONNECTED_TO_API ? global.CONSTANTS.HEROKU_PING_INTERVAL : 5000
  setTimeout(pingApi, time)
}
