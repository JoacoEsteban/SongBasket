import customGetters from '../../../renderer/store/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
const fs = require('fs')
const PATH = require('path')
const uuid = require('uuid')

export function downloadLinkRemove (localTracks, queryTracks, plFilter = []) {
  return VTWO(localTracks, queryTracks, plFilter || [])
}

// TODO turn both of this as async
export function unlink (path) {
  if (fs.existsSync(path)) fs.unlinkSync(path)
}
export function link (path, newPath) {
  console.log('linking ', path, newPath)
  if (!fs.existsSync(path)) throw new Error()
  if (fs.existsSync(newPath)) return false
  fs.linkSync(path, newPath)
  return true
}

function VTWO (localTracks, queryTracks = [], plFilter = []) {
  if (plFilter.length) localTracks.forEach(lTrack => lTrack.dontUnlink = !plFilter.includes(lTrack.playlist)) // prevents unlinking tracks when filtering playlist

  queryTracks = queryTracks.filter(qTrack => {
    if (!qTrack.conversion) return false

    if (qTrack.selection === null) qTrack.selection = qTrack.conversion.bestMatch
    if (qTrack.selection === false) qTrack.selection = qTrack.custom.id

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
  console.log('to download', queryTracks.filter(t => t.downloadFlags.download).map(t => t.data.name))
  console.log('to link', queryTracks.filter(t => !t.downloadFlags.download).map(t => t.data.name))
  console.log('to unlink', localTracks.filter(t => !t.dontUnlink).map(t => t.path))

  queryTracks = queryTracks.filter(qTrack => {
    if (qTrack.downloadFlags.download) return true
    linkTrackToPlaylists(qTrack)
    return false
  })

  localTracks.forEach(lTrack => {
    if (!lTrack.dontUnlink) unlink(lTrack.path)
  })

  return queryTracks
}

const linkTrackToPlaylists = (track) => {
  track.playlists.forEach(pl => {
    let plPath = customGetters.giveMePlFolderName(pl.id)
    if (!plPath) return
    plPath = PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(plPath))
    let fileName = track.downloadFlags.linkData.file.replace('.mp3', '')
    let didLink = false

    for (let i = 0; !didLink && i < 10; i++) {
      let suffix = i === 0 ? '' : (' - ' + uuid.v4())
      if (i > 1) suffix += (' - ' + i)
      try {
        didLink = link(track.downloadFlags.linkData.path, PATH.join(plPath, fileName + suffix + '.mp3'))
      } catch (error) {
        console.error(error || 'TRACK TO LINK DOESN\'T EXIST')
        return
      }
    }
  })
}
