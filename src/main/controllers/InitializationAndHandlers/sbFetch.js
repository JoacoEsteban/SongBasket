/* eslint-disable camelcase */
import axios from 'axios'

import PATHS from '../../Global/PATHS'
import REGEX from '../../Global/REGEX'
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

// Brings back user information
export async function guestCheck (userId) {
  try {
    let res = await Api.get(URL(PATHS.USER, userId))
    return res && res.data
  } catch (err) {
    throw err
  }
}

export async function getTracks ({userId, logged, SBID, control}, {id, snapshot_id}, checkVersion) {
  // TODO Deprecate
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
  }
}

export async function ytDetails (id) {
  try {
    let reg = REGEX.videoUrl.exec(id)
    if (!reg && !REGEX.videoId.test(id)) throw new Error('INVALID YOUTUBE VIDEO ID')
    if (reg) id = reg[1]
    console.log('gettin', PATHS.VIDEO(id))
    const resp = await Api.get(PATHS.VIDEO(id))
    return resp && resp.data
  } catch (error) {
    throw error
  }
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

export const getUserPlaylists = async (user_id, p = { offset: null }) => {
  try {
    const params = {}
    p.offset && (params.offset = p.offset)
    const res = await Api.get(PATHS.USER_PLAYLISTS(user_id), { params })
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

export async function youtubizeAll (tracks, completionCallback) {
  let totalTracks = 0
  let succeded = 0
  let failed = 0

  // try {

  // } catch (error) {

  // }

  return new Promise((resolve, reject) => {
    if (!tracks) return reject(new Error('TRACK OBJECT UNDEFINED'))
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].flags.converted && !tracks[i].conversionError) continue
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
        .catch(() => {
          tracks[i].conversion = null
          tracks[i].flags.converted = false
          tracks[i].flags.conversionError = true
          // Failed tracks will remain with 'conversion' object NULL
          console.log('Error when converting')
          failed++
        })
        .finally(() => {
          tracks[i].flags.processed = false
          completionCallback && completionCallback(totalTracks)
          areAllFinished(resolve)
        })
    }
    if (!totalTracks) areAllFinished(resolve)
  })

  function areAllFinished (resolve) {
    if (succeded + failed === totalTracks) {
      resolve({tracks, failed})
    }
  }
}
