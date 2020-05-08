import customGetters from '../Store/Helpers/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
const PATH = require('path')
const uuid = require('uuid')

export async function downloadLinkRemove (localTracks, queryTracks, plFilter = []) {
  return VTWO(localTracks, queryTracks, plFilter || [])
}

// TODO turn both of this as async
export async function unlink (path) {
  if (await utils.pathDoesExist(path)) await utils.unlink(path)
}
export async function link (path, newPath) {
  console.log('linking ', path, newPath)
  if (!await utils.pathDoesExist(path)) throw new Error()
  if (await utils.pathDoesExist(newPath)) return false
  await utils.link(path, newPath)
  return true
}

async function VTWO (localTracks, queryTracks = [], plFilter = []) {
  if (plFilter.length) localTracks.forEach(lTrack => lTrack.dontUnlink = !plFilter.includes(lTrack.playlist)) // prevents unlinking tracks when filtering playlist

  queryTracks = queryTracks.filter(qTrack => {
    if (!qTrack.conversion) return false

    if (qTrack.selection === null) qTrack.selection = qTrack.conversion.bestMatch
    if (qTrack.selection === false) qTrack.selection = qTrack.custom.youtube_id

    qTrack.downloadFlags = {
      download: true
    }

    return !localTracks.some((lTrack, i) => { // some track (full conv) exists and is in every playlist
      if (!(lTrack.songbasket_spotify_id === qTrack.id && lTrack.songbasket_youtube_id === qTrack.selection)) return false // skip

      qTrack.downloadFlags.download = false
      if (!qTrack.downloadFlags.linkData) qTrack.downloadFlags.linkData = {
        path: lTrack.path,
        file: lTrack.file
      }

      if (qTrack.playlists.some(pl => pl.id === lTrack.playlist)) lTrack.dontUnlink = true
      if (!(qTrack.playlists = qTrack.playlists.filter(pl => pl.id !== lTrack.playlist)).length) {
        localTracks.splice(i, 1)
        return true
      }
    })
  })
  // TODO dont dwnload paused playlists
  console.log('to download', queryTracks.filter(t => t.downloadFlags.download).map(t => t.data.name))
  console.log('to link', queryTracks.filter(t => !t.downloadFlags.download).map(t => t.data.name))
  console.log('to unlink', localTracks.filter(t => !t.dontUnlink).map(t => t.path))

  queryTracks = queryTracks.filter(async qTrack => {
    if (qTrack.downloadFlags.download) return true
    await linkTrackToPlaylists(qTrack)
    return false
  })

  localTracks.forEach(async lTrack => {
    if (!lTrack.dontUnlink) await unlink(lTrack.path)
  })

  return queryTracks
}

const linkTrackToPlaylists = async (track) => {
  track.playlists.forEach(async pl => {
    let plPath = customGetters.giveMePlFolderName(pl.id)
    console.log(plPath)
    if (!plPath) return
    console.log(1)
    plPath = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(plPath))
    console.log(2)
    let fileName = track.downloadFlags.linkData.file.replace('.mp3', '')
    console.log(3)
    let didLink = false

    for (let i = 0; !didLink && i < 10; i++) {
      let suffix = i === 0 ? '' : (' - ' + uuid.v4())
      if (i > 1) suffix += (' - ' + i)
      try {
        didLink = await link(track.downloadFlags.linkData.path, PATH.join(plPath, fileName + suffix + '.mp3'))
        if (didLink) return
      } catch (error) {
        console.error(error || 'TRACK TO LINK DOESN\'T EXIST')
        return
      }
    }
    throw new Error('COULD NOT LINK TRACK')
  })
}
