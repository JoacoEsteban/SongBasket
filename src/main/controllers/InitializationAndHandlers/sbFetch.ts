/* eslint-disable camelcase */
import axios, { AxiosInstance } from 'axios'
import { SongBasketTrack } from '../../../@types/SongBasket'
import { SpotifyApiPlaylistsResponse, SpotifyPlaylist, SpotifyPlaylistId, SpotifySnapshotId, SpotifyUser, SpotifyUserId } from '../../../@types/Spotify'
import { YouTubeResult, YouTubeResultId } from '../../../@types/YouTube'

import PATHS from '../../Global/PATHS'
import REGEX from '../../Global/REGEX'
// const URL = PATHS.makeUrl

console.log('BACKEND: ', PATHS.BASE)

let Api: AxiosInstance = getAxiosInstance()

function getAxiosInstance () {
  return axios.create({
    baseURL: PATHS.BASE,
    timeout: 20000,
    headers: {
      'Authorization': 'Bearer ' + global.SONGBASKET_ID,
      'user_id': global.USER_ID
    },
    validateStatus: st => (st >= 200 && st < 300) || st === 304
  })
}

export function createAxiosInstance () {
  Api = getAxiosInstance()
}

export async function ytDetails (id: YouTubeResultId) {
  let reg = REGEX.videoUrl.exec(id)
  if (!reg && !REGEX.videoId.test(id)) throw new Error('INVALID YOUTUBE VIDEO ID')
  if (reg) id = reg[1]
  console.log('gettin', PATHS.VIDEO(id))
  const resp = await Api.get<YouTubeResult>(PATHS.VIDEO(id))
  return resp && resp.data
}

// ------------ revision 2 ------------

export const getMe = async (): Promise<SpotifyUser> => {
  const res = await Api.get<SpotifyUser>(PATHS.ME)
  return res.data
}

export const getUserPlaylists = async (user_id: SpotifyUserId, p: { offset: number | null } = { offset: null }) => {
  const params = {
    offset: p.offset || 0,
  }
  const res = await Api.get<SpotifyApiPlaylistsResponse>(PATHS.USER_PLAYLISTS(user_id), { params })
  return res.data
}

export const getPlaylist = async (params: { id: SpotifyPlaylistId, snapshot_id?: SpotifySnapshotId }) => {
  const { id, snapshot_id } = params

  const res = await Api.get<SpotifyPlaylist>(PATHS.PLAYLIST(id), {
    params: {
      snapshot_id: snapshot_id || null
    }
  })

  if (res.status === 304) return null

  return res.data
}

export async function youtubizeAll (tracks: SongBasketTrack[], isConvertable: (track: SongBasketTrack) => boolean, completionCallback: ((total: number) => void) | null): Promise<{ tracks: SongBasketTrack[], failed: number }> {
  let totalTracks = 0
  let succeded = 0
  let failed = 0

  return new Promise((resolve, reject) => {
    if (!tracks) return reject(new Error('TRACK OBJECT UNDEFINED'))
    for (let i = 0; i < tracks.length; i++) {
      if (!isConvertable(tracks[i])) continue
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

  function areAllFinished (resolve: Function) {
    if (succeded + failed === totalTracks) {
      resolve({ tracks, failed })
    }
  }
}
