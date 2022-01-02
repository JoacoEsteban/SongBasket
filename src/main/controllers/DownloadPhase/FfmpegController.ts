
import { promises as fs } from 'fs'
import * as ffmpeg from 'fluent-ffmpeg'

import * as NodeID3 from 'node-id3'
import axios from 'axios'
import { SpotifyTrack } from '../../../@types/Spotify'
import { YouTubeResultId } from '../../../@types/YouTube'
import { Tags } from '../../../@types/node'

type progressEvent = {
  percent: number
}

export function extractMp3 (pathmp3: string, pathmp4: string, inputFormat: string, progressCb: (progress: progressEvent) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const command =
      ffmpeg(pathmp4)
        .inputFormat(inputFormat)
        .on('progress', progressCb)
        .on('end', async () => {
          try {
            await fs.unlink(pathmp4)
          } catch (err) {
            console.error(err)
          }
          console.log('Finished processing')
          resolve()
        })
    command.save(pathmp3)
  })
}

export async function applyTags (pathmp3: string, data: SpotifyTrack, ytSelection: YouTubeResultId) {
  let imageBuffer: Buffer | null = null
  try {
    imageBuffer = (await getPhoto(data.album.images[0].url)) || null
  } catch (error) {
    console.error('Error when getting track photo, applying tracks anyway')
  }

  const tags: Tags = {
    title: data.name,
    // artist: data.artists.map(a => a.name).join(';'), // TODO Try multiple artists
    artist: data.artists[0].name,
    album: data.album.name,
    userDefinedText: [{ // TODO fix type
      description: 'songbasket_spotify_id',
      value: data.id
    }, {
      description: 'songbasket_youtube_id',
      value: ytSelection
    }],
    image: {
      mime: 'png/jpeg', // TODO Check if this is correct
      type: {
        id: 3,
        name: 'front cover'
      },
      description: 'Cover',
      imageBuffer: imageBuffer || Buffer.alloc(0)
    }
  }

  if (!imageBuffer) delete tags.image

  console.log('writing tags')
  await new Promise<void>((resolve, reject) => NodeID3.write(tags, pathmp3, (err) => {
    if (err) return reject(err)
    resolve()
  }))
}

export async function getPhoto (url: string): Promise<Buffer> {
  console.log('getting picture')

  const resp = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  let buffer = Buffer.alloc(0)

  await new Promise<void>((resolve, reject) => {
    resp.data
      .on('data', (chunk: Uint8Array) => {
        buffer = Buffer.concat([buffer, chunk])
      })
      .on('end', () => {
        console.log('photo retrieved')
        resolve()
      })
      .catch((err: unknown) => reject(err))
  })

  return buffer
}
