import customGetters from '../../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
import * as PATH from 'path'
import { v4 as uuid } from 'uuid'
import { SongbasketCustomMp3Tags, SongBasketTrack, SongBasketTrackFile } from '../../../@types/SongBasket'
import { SpotifyPlaylistId } from '../../../@types/Spotify'

type _track = SongBasketTrackFile

type QueryTrack = SongBasketTrack & {
  downloadFlags: {
    download: boolean,
    path?: string,
    file?: string,
    linkData?: {
      path: string,
      file: string
    }
  }
}


export async function downloadLinkRemove (localTracks: _track[], queryTracks: SongBasketTrack[], plFilter: SpotifyPlaylistId[] = []) {
  return VTWO(localTracks, queryTracks, plFilter || [])
}

export async function unlink (path: string) {
  if (await utils.pathDoesExist(path)) await utils.unlink(path)
}
export async function link (path: string, newPath: string) {
  console.log('linking ', path, newPath)
  if (!await utils.pathDoesExist(path)) throw new Error()
  if (await utils.pathDoesExist(newPath)) return false
  await utils.link(path, newPath)
  return true
}

async function VTWO (_localTracks: _track[], _queryTracks: SongBasketTrack[] = [], plFilter: SpotifyPlaylistId[] = []) {
  const pausedPlaylists = customGetters.pausedPlaylists
  const dontUnlinkFrom = [...plFilter, ...pausedPlaylists]

  const localTracks = (_localTracks as (_track & { dontUnlink?: boolean })[])
  if (plFilter.length) {
    localTracks.forEach(lTrack => lTrack.dontUnlink = !dontUnlinkFrom.includes(lTrack.playlist)) // prevents unlinking tracks when filtering playlist
  }

  let queryTracks = (_queryTracks as QueryTrack[]).filter(qTrack => {
    // const qTrack = _qTrack as QueryTrack
    if (!qTrack.conversion) return false

    if (qTrack.selection === null) qTrack.selection = qTrack.conversion.bestMatch
    if (qTrack.selection === false) {
      const id = qTrack.custom?.youtube_id
      if (id) qTrack.selection = id
    }

    qTrack.downloadFlags = {
      download: !(qTrack.flags.paused || qTrack.playlists.every(({ id }) => pausedPlaylists.includes(id)))
    }

    return !localTracks.some((lTrack, i) => { // some track (full conv) exists and is in every playlist
      if (!(lTrack.songbasket_spotify_id === qTrack.id && lTrack.songbasket_youtube_id === qTrack.selection)) return false // skip

      qTrack.downloadFlags.download = false
      !qTrack.downloadFlags.linkData && (qTrack.downloadFlags.linkData = {
        path: lTrack.path,
        file: lTrack.file
      })

      if (qTrack.playlists.some(pl => pl.id === lTrack.playlist)) {
        lTrack.dontUnlink = true
        qTrack.playlists = qTrack.playlists.filter(pl => pl.id !== lTrack.playlist)
      }

      if (!qTrack.playlists.length) { // TODO prevent linking to paused playlists
        localTracks.splice(i, 1)
        return true
      }
      return false
    })
  })

  console.log('to download', queryTracks.filter(t => t.downloadFlags.download).map(t => t.data.name))
  console.log('to link', queryTracks.filter(t => !t.downloadFlags.download && t.downloadFlags.linkData).map(t => t.data.name))
  console.log('to unlink', localTracks.filter(t => !t.dontUnlink).map(t => t.path))

  queryTracks = await queryTracks.asyncFilter(async qTrack => {
    if (qTrack.downloadFlags.download) return true
    if (qTrack.downloadFlags.linkData) await linkTrackToPlaylists(qTrack)
    return false
  })

  localTracks.forEach(async lTrack => { // TODO make async with Promise.all
    if (!lTrack.dontUnlink) await unlink(lTrack.path)
  })

  return queryTracks
}

const linkTrackToPlaylists = async (track: QueryTrack) => {
  if (!track.downloadFlags.linkData) return

  track.playlists.asyncForEachParallel(async pl => {
    let plPath = customGetters.giveMePlFolderName(pl.id)
    console.log(plPath)
    if (!plPath) return
    plPath = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(plPath))
    let fileName = track.downloadFlags.linkData!.file.replace('.mp3', '')
    let didLink = false

    for (let i = 0; !didLink && i < 10; i++) { // TODO Rethink this
      let suffix = i === 0 ? '' : (' - ' + uuid())
      if (i > 1) suffix += (' - ' + i)
      try {
        didLink = await link(track.downloadFlags.linkData!.path, PATH.join(plPath, fileName + suffix + '.mp3'))
        if (didLink) return
      } catch (error) {
        console.error(error || 'TRACK TO LINK DOESN\'T EXIST')
        return
      }
    }
    throw new Error('COULD NOT LINK TRACK')
  })
}
