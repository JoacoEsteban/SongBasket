import fs from 'fs'
import PATH from 'path'
import axios from 'axios'
import uuid from 'uuid'
import { exec } from 'child_process'

import { PLATFORM, APP_CWD } from '../../Global/VARIABLES'
import * as utils from '../../../MAIN_PROCESS_UTILS'

const tempPath = APP_CWD + '/temp/'
const computed = {
  folderIconFnc: null
}

export default {
  getIconSetterHelper: () => computed.folderIconFnc || (computed.folderIconFnc = folderFns[PLATFORM]),
  plIconDownloader: (pl, iconSetterHelper) => {
    if (!pl || !pl.path || !pl.imageUrl) return null
    require('./UserMethods').default.checkPathThenCreate(tempPath)

    const { path, imageUrl } = pl
    const imageTempPath = PATH.join(tempPath, uuid.v4())

    const instance = {
      imageUrl,
      path,
      imageTempPath,
      iconSetterHelper,
      writer: fs.createWriteStream(imageTempPath)
    }
    instance.exec = function () {
      const { imageUrl, iconSetterHelper, path, writer } = this
      return new Promise(async (resolve, reject) => {
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream'
        })

        response.data.pipe(writer)

        writer.on('finish', async () => {
          try {
            await iconSetterHelper.set(path, imageTempPath)
            await utils.promisify(fs.unlink, imageTempPath)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    return instance
  }
}

const folderFns = {
  mac: {
    set (folderPath, iconPath) {
      return new Promise((resolve, reject) => {
        if (!folderPath) return reject(new Error('NO FOLDER PATH'))
        if (!iconPath) return reject(new Error('NO ICON PATH'))

        exec(`fileicon set ${folderPath} ${iconPath}`, (err, m) => {
          if (err) return reject(err)
          resolve()
        })
      })
    },
    test (path) {
      return new Promise((resolve, reject) => {
        if (!path) throw new Error('NO PATH')

        exec(`fileicon test ${path}`, (err, m) => {
          if (err) resolve(false)
          else resolve(m.indexOf('HAS custom icon') > -1)
        })
      })
    },
    remove (path) {
      return new Promise((resolve, reject) => {
        if (!path) throw new Error('NO PATH')
        exec(`fileicon rm ${path}`, (err, m) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }
}
