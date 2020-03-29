import customGetters from '../../../renderer/store/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'

const fs = require('fs')

export function downloadLinkRemove (localTracks, queryTracks) {
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
            // TODO just make this visible to the user
            continue
          }
          pl.selected = pl.selected === null ? qt.conversion.bestMatch : pl.selected === false ? qt.custom.id : pl.selected

          let samePl = pl.id === lt.playlist
          let sameVer = pl.selected === lt.songbasket_youtube_id
          console.log('a ver', samePl, sameVer)
          if (samePl || sameVer) {
            found = true

            if (sameVer && samePl) {
              qt.playlists.splice(u, 1) // Track found, skipping
              u--
              found = true
            } else {
              if (!sameVer) { // Same playlist but version changed, so unlink it when everything has been verified
                unlinkTrack = true
              }
              if (!samePl) { // Same version, diff pl. Hardlink into this playlist
                const plPath = customGetters.giveMePlFolderName(pl.id)
                if (plPath) {
                  console.log('LINKING EXISTING TRACK')
                  linkQueue.push({paths: [lt.path, global.HOME_FOLDER + '/' + utils.encodeIntoFilename(plPath) + '/' + lt.file], indexes: [i, u]})
                }
              }
            }
          }
        }
        if (found) {
          if (unlinkTrack) {
            unlinkQueue.push(lt)
          }
          localTracks.splice(o, 1)
          o--
        }
      }
    }
  }

  linkQueue.forEach(track => {
    link(track.paths[0], track.paths[1] + '.temp')
    queryTracks[track.indexes[0]].playlists.splice(track.indexes[1], 1)
  })

  unlinkQueue = [...unlinkQueue, ...localTracks]
  unlinkQueue.forEach(track => {
    console.log('UNLINKING TRACK')
    unlink(track.path)
  })

  linkQueue.forEach(track => {
    if (fs.existsSync(track.paths[1])) fs.unlinkSync(track.paths[1])
    fs.renameSync(track.paths[1] + '.temp', track.paths[1])
  })

  return queryTracks
}

// TODO consider both of this as async
export function unlink (path) {
  // let a = true
  // if (a) return
  if (fs.existsSync(path))fs.unlinkSync(path)
}
export function link (path, newPath) {
  console.log('linking ', path, newPath)
  let exists = fs.existsSync(path) && !fs.existsSync(newPath)
  console.log(fs.existsSync(path), fs.existsSync(path))
  if (exists) fs.linkSync(path, newPath)
  return exists
}
