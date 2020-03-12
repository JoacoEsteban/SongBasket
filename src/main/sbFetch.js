/* eslint-disable camelcase */
import store from '../renderer/store'
const axios = require('axios')

const Backend = process.env.BACKEND
console.log('BACKEND::::::', Backend)

let loadingCount = 0
function LOADING (value, target) {
  if (!value) value = false
  if (value) loadingCount++
  else loadingCount--
  console.log('loadingcount', loadingCount)
  store.dispatch('fetchLoadingState', {value: loadingCount > 0, target})
}

// Brings back user information
export async function guestLogin (userId) {
  let url = Backend + '/guest_sign_in'
  try {
    let res = await axios.get(url, { params: { user_id: userId } })
    return res.data
  } catch (err) {
    throw err
  }
}

// Retrieves user's playlists
export async function fetchPlaylists ({userId, logged, SBID, control}) {
  LOADING(true, 'Getting Playlists')
  let url = Backend + '/retrieve'
  let params = {
    user_id: userId,
    logged,
    SBID,
    offset: control.offset,
    retrieve: 'user_playlists',
    retrieve_user_data: true
  }
  try {
    let res = await axios.get(url, {params})
    return res.data
  } catch (err) {
    throw (err)
  } finally {
    LOADING()
  }
}

export async function getTracks ({userId, logged, SBID, control}, {id, snapshot_id}, checkVersion) {
  LOADING(true, 'Getting Playlist Tracks')
  let url = Backend + '/retrieve'
  let params = {
    user_id: userId,
    logged,
    SBID,
    retrieve: 'playlist_tracks',
    playlist_id: id,
    retrieve_user_data: false
  }
  if (checkVersion) params.snapshot_id = snapshot_id
  console.log('snapshot_id', snapshot_id)
  try {
    let res = await axios.get(url, { params })
    return res.data
  } catch (err) {
    // TODO Check on timeouts being fucking high
    console.error('ERROR AT sbFetch, getTracks::::', err)
    throw err
  } finally {
    LOADING()
  }
}

export function youtubizeAll (tracks) {
  let totalTracks = 0
  let succeded = 0
  let failed = 0
  return new Promise((resolve, reject) => {
    LOADING(true, 'Converting')
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].conversion !== null) continue
      let track = tracks[i].query
      totalTracks++
      track = JSON.stringify(track)
      console.log('fwing trackie::', track)
      axios.post(`${Backend}/youtubize`, {
        track
      })
        .then(res => {
          tracks[i].conversion = res.data
          succeded++
          // TODO Emit success event
        })
        .catch(err => {
          // Failed tracks will remain with 'conversion' object NULL
          console.log('Error', err)
          failed++
          // TODO Emit fail event
        })
        .finally(() => {
          areAllFinished(resolve)
        })
    }
    if (totalTracks === 0) areAllFinished(resolve)
  })

  function areAllFinished (resolve) {
    if (succeded + failed === totalTracks) {
      LOADING()
      resolve(tracks)
    }
  }
}

export function ytDetails (id) {
  return new Promise((resolve, reject) => {
    LOADING(true, 'Getting Video Details')
    axios.get(`${Backend}/yt_details`, {params: {ytId: id}})
      .then(resp => {
        resolve(resp.data)
      })
      .catch(err => reject(err))
      .finally(() => {
        LOADING()
      })
  })
}
