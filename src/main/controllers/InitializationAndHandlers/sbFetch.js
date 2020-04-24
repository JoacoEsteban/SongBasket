/* eslint-disable camelcase */
import store from '../../../renderer/store'
import axios from 'axios'

import PATHS from '../../Global/PATHS'
const URL = PATHS.makeUrl

console.log('BACKEND: ', PATHS.BASE)

let Api
export function createAxiosInstance () {
  Api = axios.create({
    baseURL: PATHS.BASE,
    timeout: 10000,
    headers: {
      'Authorization': 'Bearer ' + global.SONGBASKET_ID,
      'user_id': global.USER_ID
    },
    validateStatus: st => (st >= 200 && st < 300) || st === 304
  })
}

const Backend = process.env.BACKEND

let loadingCount = 0
function LOADING (value, target) {
  if (!value) value = false
  if (value) loadingCount++
  else loadingCount && loadingCount--
  console.log('loadingcount', loadingCount)
  store.dispatch('fetchLoadingState', {value: loadingCount > 0, target})
}

// Brings back user information
export async function guestCheck (userId) {
  try {
    let res = await Api.get(URL(PATHS.USER, userId))
    return res && res.data
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
    throw err
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
    console.error('ERROR AT sbFetch, getTracks::::', err.data, err.data.reason.join(', '))
    throw err
  } finally {
    LOADING()
  }
}

export function youtubizeAllOld (tracks) {
  let totalTracks = 0
  let succeded = 0
  let failed = 0
  return new Promise((resolve, reject) => {
    LOADING(true, 'Converting')
    if (!tracks) return reject(new Error('TRACK OBJECT UNDEFINED'))
    for (let i = 0; i < tracks.length; i++) {
      if (((tracks[i].flags = (tracks[i].flags || {})) && tracks[i].flags.converted) || (tracks[i].conversion && (tracks[i].flags.converted = true))) { console.log('nono skipping'); continue }
      totalTracks++
      Api.post(PATHS.YOUTUBIZE, {
        track: JSON.stringify(tracks[i].query)
      })
        .then(res => {
          console.log('on .then => conversion successful?', !!(res && res.data))
          if (!res || !res.data) throw new Error('Conversion doesn\'t exist')
          tracks[i].conversion = res.data
          tracks[i].flags.converted = true
          tracks[i].flags.conversionError = false
          succeded++
          // TODO Emit success event
        })
        .catch(err => {
          tracks[i].conversion = null
          tracks[i].flags.converted = false
          tracks[i].flags.conversionError = true
          // Failed tracks will remain with 'conversion' object NULL
          console.log('Error when converting', err)
          failed++
          // TODO Emit fail event
        })
        .finally(() => {
          tracks[i].flags.processed = false
          areAllFinished(resolve)
        })
    }
    if (!totalTracks) areAllFinished(resolve)
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

// ------------ revision 2 ------------

export const getMe = async () => {
  try {
    const res = await Api.get(PATHS.ME)
    return res && res.data
  } catch (error) {
    throw error
  }
}

export const getUserPlaylists = async (user_id) => {
  try {
    const res = await Api.get(PATHS.USER_PLAYLISTS(user_id))
    return res && res.data
  } catch (error) {
    throw error
  }
}

export const getPlaylist = async ({ id, snapshot_id }) => {
  try {
    const params = {}
    if (snapshot_id) params.snapshot_id = snapshot_id

    const res = await Api.get(PATHS.PLAYLIST(id), { params })
    if (res.status === 304) return null

    return res && res.data
  } catch (error) {
    throw error
  }
}

export async function youtubizeAll (tracks) {
  let totalTracks = 0
  let succeded = 0
  let failed = 0

  // try {

  // } catch (error) {

  // }

  return new Promise((resolve, reject) => {
    LOADING(true, 'Converting')
    if (!tracks) return reject(new Error('TRACK OBJECT UNDEFINED'))
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].flags.converted && !tracks[i].conversionError) { console.log('nono skipping'); continue }
      totalTracks++
      Api.post(PATHS.YOUTUBIZE, {
        track: JSON.stringify(tracks[i].query)
      })
        .then(res => {
          console.log('on .then => conversion successful?', !!(res && res.data))
          if (!res || !res.data) throw new Error('Conversion doesn\'t exist')
          tracks[i].conversion = res.data
          tracks[i].flags.converted = true
          tracks[i].flags.conversionError = false
          succeded++
          // TODO Emit success event
        })
        .catch(err => {
          tracks[i].conversion = null
          tracks[i].flags.converted = false
          tracks[i].flags.conversionError = true
          // Failed tracks will remain with 'conversion' object NULL
          console.log('Error when converting', err)
          failed++
          // TODO Emit fail event
        })
        .finally(() => {
          tracks[i].flags.processed = false
          areAllFinished(resolve)
        })
    }
    if (!totalTracks) areAllFinished(resolve)
  })

  function areAllFinished (resolve) {
    if (succeded + failed === totalTracks) {
      LOADING()
      resolve(tracks)
    }
  }
}
