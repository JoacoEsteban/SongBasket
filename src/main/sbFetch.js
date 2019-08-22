import fetch from 'electron-fetch'
import {logme} from '../UTILS'

const localBackend = 'http://192.168.0.69:5000'
// const herokuBackend = 'https://songbasket-backend.herokuapp.com'
const Backend = localBackend

export function guestLogin (userId) {
  return new Promise((resolve, reject) => {
    fetch(`${Backend}/guest_sign_in?user_id=${userId}`)
      .then(res => {
        res.text()
          .then(body => {
            body = JSON.parse(body)
            console.log(body)
            resolve(body)
          })
      })
  })
}

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

export function searchTrackOnYT (track) {
  track = JSON.stringify(track)
  return new Promise((resolve, reject) => {
    fetch(`${Backend}/retrieve?retrieve=youtube_convert&track=${track}`)
      .then(res => {
        res.text()
          .then(body => {
            resolve(JSON.parse(body))
          })
      })
  })
}
export function youtubizeAll (tracks) {
  // tracks = JSON.stringify(tracks)
  // console.log('Trackies', tracks)
  tracks = ''
  for (let index = 0; index < 1024 * 5; index++) {
    tracks += 'f'
  }
  return new Promise((resolve, reject) => {
    fetch(`${Backend}/retrieve?retrieve=youtubize&tracks=${tracks}`)
      .then(res => {
        res.text()
          .then(body => {
            resolve(JSON.parse(body))
          })
      })
  })
}
