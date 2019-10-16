/* eslint-disable camelcase */
import fetch from 'electron-fetch'
import store from '../renderer/store'
const axios = require('axios')

const localBackend = 'http://localhost:5000'
// const herokuBackend = 'https://songbasket-backend.herokuapp.com'
const Backend = localBackend

function LOADING (value, target) {
  if (!value) value = false
  store.dispatch('globalLoadingState', {value, target})
}

// Brings back user information
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

// Retrieves user's playlists
export function fetchPlaylists ({userId, logged, SBID, control}) {
  return new Promise((resolve, reject) => {
    fetch(`${Backend}/retrieve?user_id=${userId}&logged=${logged.toString()}&SBID=${SBID}&offset=${control.offset}&retrieve=playlists&retrieve_user_data=true`)
      .then(res => {
        res.text()
          .then(body => {
            resolve(JSON.parse(body))
          })
          .catch(err => reject(err))
      })
      .catch(err => reject(err))
  })
}

export function getTracks ({userId, logged, SBID, control}, {id, snapshot_id}, checkVersion) {
  let playlistId = id
  return new Promise((resolve, reject) => {
    LOADING(true, 'Getting Playlist Tracks')
    fetch(`${Backend}/retrieve?user_id=${userId}&logged=${logged}&SBID=${SBID}&offset=${control.offset}&retrieve=playlist_tracks&playlist_id=${playlistId}&retrieve_user_data=false${checkVersion ? '&snapshot_id=' + snapshot_id : ''}`)
      .then(res => {
        LOADING()
        res.text()
          .then(body => {
            resolve(JSON.parse(body))
          })
          .catch(error => {
            console.log(error)
          })
      })
      .catch(error => {
        reject(error)
      })
  })
}

export function youtubizeAll (playlists) {
  playlists = JSON.stringify(playlists)
  console.log('Trackies', playlists)
  return new Promise((resolve, reject) => {
    LOADING(true, 'Converting')
    axios.post(`${Backend}/youtubize`, {
      playlists
    })
      .then(res => {
        LOADING()
        resolve(res.data)
      })
      .catch(err => {
        LOADING()
        reject(err)
      })
  })
}
