import fetch from 'electron-fetch'
import {logme} from '../UTILS'

const localBackend = 'http://localhost:5000'
// const herokuBackend = 'https://songbasket-backend.herokuapp.com'
const Backend = localBackend

export async function fetchPlaylists ({userId, logged, SBID, control}) {
  var limit = 20
  let res = await fetch(`${Backend}/retrieve?user_id=${userId}&logged=${logged.toString()}&SBID=${SBID}&limit=${limit}&offset=${control.offset}&retrieve=playlists&retrieve_user_data=true`)
  let body = await res.text()
  return Promise.resolve(JSON.parse(body))
}

export async function getTracks ({userId, logged, SBID, control}, playlistId) {
  logme(SBID)
  let res = await fetch(`${Backend}/retrieve?user_id=${userId}&logged=${logged.toString()}&SBID=${SBID}&limit=100&offset=${control.offset}&retrieve=playlist_tracks&playlist_id=${playlistId}&retrieve_user_data=false`)
  let body = await res.text()
  return Promise.resolve(JSON.parse(body))
}
