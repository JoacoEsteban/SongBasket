import fs from 'fs'
import PATH from 'path'
import axios from 'axios'
import uuid from 'uuid'
import toIco from 'to-ico'
import Jimp from 'Jimp'
import { exec } from 'child_process'

import * as utils from '../../../MAIN_PROCESS_UTILS'

const { PLATFORM, APP_CWD } = global.CONSTANTS
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
      writer: () => fs.createWriteStream(imageTempPath)
    }
    instance.exec = function () {
      const { imageUrl, iconSetterHelper, path, writer } = this
      return new Promise(async (resolve, reject) => {
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream'
        })
        const writerIns = writer()
        response.data.pipe(writerIns)

        writerIns.on('finish', async () => {
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
    get fileIconPath () {
      // try {
      // !this.moduleImported && (require('fileicon') + (this.moduleImported = true))
      return PATH.join(global.CONSTANTS.NODE_MODULES_PATH, 'fileicon', 'bin', 'fileicon')
      // } catch (error) {
      //   throw error
      // }
    },
    set (folderPath, iconPath) {
      return new Promise((resolve, reject) => {
        if (!folderPath) return reject(new Error('NO FOLDER PATH'))
        if (!iconPath) return reject(new Error('NO ICON PATH'))
        // TODO Fix this command in build by directly referencing binary
        try {
          exec(`${this.fileIconPath} set ${folderPath} ${iconPath}`, (err, m) => {
            if (err) return reject(err)
            resolve()
          })
        } catch (error) {
          reject(error)
        }
      })
    },
    test (path) {
      return new Promise((resolve, reject) => {
        if (!path) throw new Error('NO PATH')

        try {
          exec(`${this.fileIconPath} test ${path}`, (err, m) => {
            if (err) resolve(false)
            else resolve(m.indexOf('HAS custom icon') > -1)
          })
        } catch (error) {
          reject(error)
        }
      })
    },
    remove (path) {
      return new Promise((resolve, reject) => {
        if (!path) throw new Error('NO PATH')
        try {
          exec(`${this.fileIconPath} rm ${path}`, (err, m) => {
            if (err) reject(err)
            else resolve()
          })
        } catch (error) {
          reject(error)
        }
      })
    }
  },
  windows: {
    guidelines: {
      iconName: 'foldericon.ico',
      iniName: 'desktop.ini',
      get iconInIniTest () {
        return `IconResource=${this.iconName},0`
      },
      get iniContents () {
        return `[.ShellClassInfo]\r\n${this.iconInIniTest}\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Pictures\r\n`
      },
      setSysProtectedCmd: path => `attrib +s +h ${path} /S /D`
    },
    validateIcon (imagePath) {
      return new Promise(async (resolve, reject) => {
        const img = await Jimp.read(imagePath)
        img.cover(256, 256, async (err, img) => {
          if (err) return reject(err)
          resolve(await img.getBufferAsync(Jimp.MIME_PNG))
        })
      })
    },
    async convertIcon (path) {
      const buff = await this.validateIcon(path)
      return toIco(buff)
    },
    hideFile (path) {
      return new Promise((resolve, reject) => {
        exec(this.guidelines.setSysProtectedCmd(path), err => err ? reject(err) : resolve())
      })
      // ... TODO MAKE THIS GLOBALLY AVAILABLE
    },
    async makeIcon (path, buff) {
      try {
        await utils.writeFile(path, buff)
        await this.hideFile(path)
      } catch (error) {
        throw error
      }
    },
    async createIniFile (path) {
      const inipath = PATH.join(path, this.guidelines.iniName)
      try {
        if (await utils.pathDoesExist(inipath))
          if (await (utils.readFile(inipath)).includes(this.guidelines.iconInIniTest)) return
        await utils.writeFile(inipath, this.guidelines.iniContents, 'utf16le')
        // await utils.link('C:/Users/Temp/Music/SB/template.ini', inipath)
        await this.hideFile(inipath)
      } catch (error) {
        throw error
      }
    },
    async set (folderPath, imagePath) {
      if (!folderPath) throw new Error('NO FOLDER PATH')
      if (!imagePath) throw new Error('NO ICON PATH')
      const finalIconPath = PATH.join(folderPath, this.guidelines.iconName)
      try {
        await this.remove(folderPath)
        const buff = await this.convertIcon(imagePath)
        await this.makeIcon(finalIconPath, buff)
        await this.createIniFile(folderPath)
      } catch (error) {
        throw error
      }
    },
    async test (path) {
      if (!path) throw new Error('NO PATH')
      try {
        const {iconName, iniName, iconInIniTest} = this.guidelines
        const join = p => PATH.join(path, p)
        const exists = async p => utils.pathDoesExist(join(p))

        if (!await exists(iconName)) return false
        if (!await exists(iniName)) return false

        return (await utils.readFile(join(iniName))).includes(iconInIniTest)
      } catch (error) {
        throw error
      }
    },
    async remove (path) {
      await utils.unlinkSafe(PATH.join(path, this.guidelines.iniName))
      await utils.unlinkSafe(PATH.join(path, this.guidelines.iconName))
    }
  }
}
