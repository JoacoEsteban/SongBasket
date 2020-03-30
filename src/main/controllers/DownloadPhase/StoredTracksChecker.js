import customGetters from '../../../renderer/store/customGetters'
import * as utils from '../../../MAIN_PROCESS_UTILS'
const fs = require('fs')
const PATH = require('path')

const v2 = false

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

  // if (v2) {
  //   const linkTrackToPlaylists = (track, local) => {
  //     track.playlists.forEach(pl => {
  //       const plPath = customGetters.giveMePlFolderName(pl.id)
  //       if (!plPath) return
  //       link(local.path, (pl.path, local.file) + '.temp')
  //     })
  //   }

  //   const removePlaylistTmpFile = (track, local) => {
  //     track.playlists.forEach(pl => {
  //       const plPath = customGetters.giveMePlFolderName(pl.id)
  //       if (!plPath) return
  //       if (fs.existsSync(track.paths[1])) fs.unlinkSync(track.paths[1])
  //       fs.renameSync(track.paths[1] + '.temp', track.paths[1])
  //     })
  //   }

  //   const normalizeLocalTracks = tracks => {
  //     const normalized = {}

  //     tracks.forEach(track => {
  //       const { songbasket_spotify_id, songbasket_youtube_id, path, file, playlist } = track
  //       if (!normalized[songbasket_spotify_id]) normalized[songbasket_spotify_id] = {}
  //       if (!normalized[songbasket_spotify_id][songbasket_youtube_id]) normalized[songbasket_spotify_id][songbasket_youtube_id] = {}

  //       normalized[songbasket_spotify_id][songbasket_youtube_id][playlist] = {
  //         ...track,
  //         flags: {
  //           isUsed: false
  //         }
  //       }
  //     })

  //     return normalized
  //   }

  //   localTracks = normalizeLocalTracks(localTracks)

  //   queryTracks = queryTracks.map(queryTrack => {
  //     if (!queryTrack.conversion) return null

  //     const flags = {}
  //     flags.doDownload = true
  //     const item = {flags, track: queryTrack}
  //     const selection = queryTrack.selection === null ? queryTrack.conversion.bestMatch : queryTrack.selection === false ? queryTrack.custom.id : queryTrack.selection

  //     let found = false

  //     if (localTracks[queryTrack.id]) {
  //       if (localTracks[queryTrack.id][selection]) {
  //         flags.doDownload = false
  //         flags.link = true
  //       }
  //     }

  //     // for (const localTrack of localTracks) {
  //     //   if (!(queryTrack.id === localTrack.songbasket_spotify_id)) continue
  //     //   // Found track
  //     //   if (selection === localTrack.songbasket_youtube_id) {
  //     //     found = true

  //     //     flags.doDownload = false
  //     //     linkTrackToPlaylists(queryTrack, localTrack)
  //     //     item.cb2 = () => {
  //     //       removePlaylistTmpFile(queryTrack)
  //     //     }
  //     //     break
  //     //   }
  //     // }

  //     return item
  //   }).filter(t => t)

  // }

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
  let exists = fs.existsSync(path) && !fs.existsSync(newPath)
  console.log(fs.existsSync(path), fs.existsSync(path))
  if (exists) fs.linkSync(path, newPath)
  return exists
}
