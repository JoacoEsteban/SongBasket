import * as fs from 'fs'
import * as PATH from 'path'

export function cloneObject (aObject: any) {
  return clone(aObject)
}
function clone (aObject: any) {
  if (!aObject) {
    return aObject
  }

  let v
  let bObject: { [key: string]: any } = Array.isArray(aObject) ? [] : {}
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = (typeof v === 'object') ? clone(v) : v
  }

  return bObject
}

export function removeDuplication (array: any[]) {
  if (!Array.isArray(array)) return
  for (let i = 0; i < array.length; i++) {
    array = [array[i], ...array.filter(item => item !== array[i])]
  }
  return array
}

export function removeDuplicationId (array: any[]) {
  if (!Array.isArray(array)) return
  for (let i = 0; i < array.length; i++) {
    array = [array[i], ...array.filter(item => item.id !== array[i].id)]
  }
  return array
}

export function encodeIntoFilename (text: string) {
  let reg = /\\|\/|\*|\?|:|\*|\||"|<|>/g
  return text.replace(reg, '-')
}

export async function createDirRecursive (path: string) {
  let pathArray = path.split(/\/|\\/)
  if (await pathDoesExist(path)) return

  let subPath = (global.CONSTANTS.PLATFORM === 'windows' ? pathArray.splice(0, 1) : '') + '/'
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

export function pathDoesExist (path: string) {
  return new Promise((resolve, reject) => {
    fs.stat(path, err => resolve(!err))
  })
}
export function readFile (path: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => err ? reject(err) : resolve(data))
  })
}
export function writeFile (...args): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(...args, err => err ? reject(err) : resolve())
  })
}
export function link (path: string, path2: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.link(path, path2, err => err ? reject(err) : resolve())
  })
}
export function unlink (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(path, err => err ? reject(err) : resolve())
  })
}
export async function unlinkSafe (path: string) {
  if (await pathDoesExist(path)) await unlink(path)
}
export function createDir (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => err ? reject(err) : resolve())
  })
}

export function linkNRemove (path1: string, path2: string) {
  return new Promise((resolve, reject) => {
    link(path1, path2)
      .then(() => {
        unlink(path1)
          .then(resolve)
          .catch(reject)
      })
      .catch(reject)
  })
}
export function copyNRemove (path1: string, path2: string): Promise<void> {
  return new Promise((resolve, reject) => fs.copyFile(path1, path2, err => err ? reject(err) : fs.unlink(path1, err => err ? reject(err) : resolve())))
}

export function isSameDisk (path1: string, path2: string) {
  path1 = path1.toLowerCase()
  path2 = path2.toLowerCase()
  switch (global.CONSTANTS.PLATFORM) {
    case 'mac':
      if (path1.indexOf('/volumes') === 0) {
        if (path2.indexOf('/volumes') === 0) {
          // Not OS Disk, check disk
          const getDisk = (path: string) => {
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

export function promisify (func, params) {
  if (!Array.isArray(params)) params = [params]
  return new Promise((resolve, reject) => {
    func(...params, (...args) => resolve(args))
  })
}
