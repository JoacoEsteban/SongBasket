import customGetters from '../../../renderer/store/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
const fs = require('fs')
const PATH = require('path')
const uuid = require('uuid')

const v2 = true

export function downloadLinkRemove (localTracks, queryTracks) {
  if (!v2) {
    let linkQueue = []
    let unlinkQueue = []
    for (let i = 0; i < queryTracks.length; i++) {
      let qt = queryTracks[i]
      for (let o = 0; o < localTracks.length; o++) {
        let lt = localTracks[o]
        if (qt.id === lt.songbasket_spotify_id) {
          console.log('FOUND') // same SP Track
          let found = false
          let unlinkTrack = false
          console.log('playlists', qt.playlists.length, lt.playlist)
          for (let u = 0; u < qt.playlists.length; u++) {
            let pl = qt.playlists[u]
            if (!qt.conversion) {
              // Track was not converted
              // If they run the conversion again this tracks will automatically convert so not really a big deal
              continue
            }
            pl.selected = pl.selected === null ? qt.conversion.bestMatch : pl.selected === false ? qt.custom.id : pl.selected

            let samePl = pl.id === lt.playlist
            let sameVer = pl.selected === lt.songbasket_youtube_id
            console.log('a ver', samePl, sameVer)
            if (samePl || sameVer) {
              found = true

              if (sameVer && samePl) {
                qt.playlists.splice(u--, 1) // Track is downloaded found, skipping
                found = true
              } else {
                if (!sameVer) { // Same playlist but version changed, so unlink it when everything has been verified
                  unlinkTrack = true
                }
                if (!samePl) { // Same version, diff pl. Hardlink into this playlist
                  const plPath = customGetters.giveMePlFolderName(pl.id)
                  if (plPath) {
                    console.log('LINKING EXISTING TRACK')
                    const localI = i
                    const localU = u
                    linkQueue.push({paths: [lt.path, PATH.join(global.HOME_FOLDER, utils.encodeIntoFilename(plPath), lt.file)], afterLinkCb: () => queryTracks[localI].playlists.splice(localU, 1)})
                  }
                }
              }
            }
          }
          if (found) {
            if (unlinkTrack) {
              unlinkQueue.push(lt)
            }
            localTracks.splice(o--, 1)
          }
        }
      }
    }

    linkQueue.forEach(track => {
      link(track.paths[0], track.paths[1] + '.temp')
      track.afterLinkCb && track.afterLinkCb()
    })

    // unlinkQueue = [...unlinkQueue, ...localTracks]
    unlinkQueue.forEach(track => {
      console.log('UNLINKING TRACK')
      unlink(track.path)
    })

    linkQueue.forEach(track => {
      if (fs.existsSync(track.paths[1])) fs.unlinkSync(track.paths[1])
      fs.renameSync(track.paths[1] + '.temp', track.paths[1])
    })
  }

  if (v2) VTWO(localTracks, queryTracks)

  return queryTracks
}

// TODO turn both of this as async
export function unlink (path) {
  // let a = true
  // if (a) return
  if (fs.existsSync(path))fs.unlinkSync(path)
}
export function link (path, newPath) {
  console.log('linking ', path, newPath)
  let valid = fs.existsSync(path) && !fs.existsSync(newPath)
  if (valid) fs.linkSync(path, newPath)
  return valid
}

function VTWO (localTracks, queryTracks = []) {
  // need to get all querytracks downloaded
  // have all downloaded tracks with spid ytid & plid
  // so find querytrack in localtrack
  // // if found === continue
  // // if found == link
  // // if !found download

  console.log('before filter \n', queryTracks.length, localTracks.length)
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

      if (!(qTrack.playlists = qTrack.playlists.filter(pl => pl.id !== lTrack.playlist)).length) {
        localTracks.splice(i, 1)
        return true
      }
    })
  })
  console.log('after filter \n', queryTracks.length, localTracks.length)
  console.log('to download', queryTracks.filter(t => t.downloadFlags.download).map(t => t.data.name))
  console.log('to link', queryTracks.filter(t => !t.downloadFlags.download).map(t => t.data.name))

  queryTracks = queryTracks.filter(qTrack => {
    if (qTrack.downloadFlags.download) return true
    linkTrackToPlaylists(qTrack)
  })

  localTracks.forEach(lTrack => {
    unlink(lTrack.path)
  })
}

const linkTrackToPlaylists = (track) => {
  track.playlists.forEach(pl => {
    const plPath = customGetters.giveMePlFolderName(pl.id)
    let fileName = track.downloadFlags.linkData.file.replace('.mp3', '')
    let didLink = false

    for (let i = 0; !didLink && i < 100; i++) {
      let suffix = i === 0 ? '' : (' - ' + uuid())
      if (i > 1) suffix += (' - ' + i)
      didLink = link(track.downloadFlags.linkData.path, PATH.join(utils.encodeIntoFilename(plPath), fileName + suffix + '.mp3'))
    }
  })
}
