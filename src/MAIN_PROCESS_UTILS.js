const fs = require('fs')
const PATH = require('path')
const GLOBAL = require('./main/Global/VARIABLES')

export function cloneObject (aObject) {
  return clone(aObject)
}
function clone (aObject) {
  if (!aObject) {
    return aObject
  }

  let v
  let bObject = Array.isArray(aObject) ? [] : {}
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = (typeof v === 'object') ? clone(v) : v
  }

  return bObject
}

export function removeDuplication (array) {
  if (!Array.isArray(array)) return
  for (let i = 0; i < array.length; i++) {
    array = [array[i], ...array.filter(item => item !== array[i])]
  }
  return array
}

export function removeDuplicationId (array) {
  if (!Array.isArray(array)) return
  for (let i = 0; i < array.length; i++) {
    array = [array[i], ...array.filter(item => item.id !== array[i].id)]
  }
  return array
}

export function encodeIntoFilename (text) {
  let reg = /\\|\/|\*|\?|:|\*|\||"|<|>/g
  return text.replace(reg, '-')
}

export async function createDirRecursive (path) {
  let pathArray = path.split(/\/|\\/)
  if (await pathDoesExist(path)) return

  let subPath = (GLOBAL.PLATFORM === 'windows' ? pathArray.splice(0, 1) : '') + '/'
  for (let i = 0; i < pathArray.length; i++) {
    subPath = PATH.join(subPath, pathArray[i])
    if (!await pathDoesExist(subPath)) {
      try {
        await createDir(subPath)
      } catch (err) {
        console.error('ERROR CREATING PATH RECURSIVELY')
        throw err
      }
    }
  }
}

export function pathDoesExist (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, noterr) => {
      resolve(!err)
    })
  })
}
export function createDir (path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, (err, noterr) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function linkNRemove (path1, path2) {
  return new Promise((resolve, reject) => {
    fs.link(path1, path2, (err, noterr) => {
      if (err) reject(err)
      else {
        fs.unlink(path1, (err, noterr) => {
          if (err) reject(err)
          else resolve()
        })
      }
    })
  })
}
export function copyNRemove (path1, path2) {
  return new Promise((resolve, reject) => {
    fs.copyFile(path1, path2, (err, noterr) => {
      if (err) reject(err)
      else {
        fs.unlink(path1, (err, noterr) => {
          if (err) reject(err)
          else resolve()
        })
      }
    })
  })
}

export function isSameDisk (path1, path2) {
  path1 = path1.toLowerCase()
  path2 = path2.toLowerCase()
  switch (GLOBAL.PLATFORM) {
    case 'mac':
      if (path1.indexOf('/volumes') === 0) {
        if (path2.indexOf('/volumes') === 0) {
          // Not OS Disk, check disk
          const getDisk = (path) => {
            let shorten = path.substring('/volumnes'.length)
            return shorten.slice(0, shorten.indexOf('/'))
          }
          return getDisk(path1) === getDisk(path2)
        } else {
          // OS Disk
          return false
        }
      } else {
        return path2.indexOf('/volumes') !== 0
      }
    case 'windows':
      return path1.slice(0, path1.indexOf(':')) === path2.slice(0, path2.indexOf(':'))
    case 'other':
      break
  }
}
