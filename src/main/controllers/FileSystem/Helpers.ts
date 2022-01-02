import { promises as fs } from 'fs'
import * as fsCb from 'fs'
import * as PATH from 'path'
import axios from 'axios'
import { v4 as uuid } from 'uuid'
import * as toIco from 'to-ico'
import * as Jimp from 'Jimp'
import { exec } from 'child_process'

import * as utils from '../../../MAIN_PROCESS_UTILS'
import UserMethods from './UserMethods'
import { Platform } from '../../../@types/App'

type FolderIconController = {
  [key: string]: any,
  set: (path: string, imageTempPath: string) => Promise<void>,
  test: (path: string) => Promise<boolean>,
  remove: (path: string) => Promise<void>
}

const { PLATFORM, TEMP_PATH } = global.CONSTANTS
const tempPath = TEMP_PATH + '/image/'
const computed: { folderIconFnc: FolderIconController | null } = {
  folderIconFnc: null
}

export default {
  getIconSetterHelper: () => computed.folderIconFnc || (computed.folderIconFnc = folderFns[PLATFORM as Platform]),
  plIconDownloader: (pl: { path: string, imageUrl: string }, iconSetterHelper: FolderIconController) => {
    if (!pl || !pl.path || !pl.imageUrl) return null
    UserMethods.checkPathThenCreate(tempPath)

    const { path, imageUrl } = pl
    const imageTempPath = PATH.join(tempPath, uuid())

    const instance = {
      imageUrl,
      path,
      imageTempPath,
      iconSetterHelper,
      writer: () => fsCb.createWriteStream(imageTempPath),
      exec: () => {}
    }
    instance.exec = function () {
      const { imageUrl, iconSetterHelper, path, writer } = this
      return new Promise<void>(async (resolve, reject) => {
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
            await fs.unlink(imageTempPath)
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

const folderFns: {
  [key in Platform]: FolderIconController
} = {
  [Platform.mac]: {
    get fileIconPath () {
      return PATH.join(global.CONSTANTS.NODE_MODULES_PATH, 'fileicon', 'bin', 'fileicon')
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
  [Platform.windows]: {
    guidelines: {
      iconName: 'foldericon.ico',
      iniName: 'desktop.ini',
      get iconInIniTest () {
        return `IconResource=${this.iconName},0`
      },
      get iniContents () {
        return `[.ShellClassInfo]\r\n${this.iconInIniTest}\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Pictures\r\n`
      },
      setSysProtectedCmd: (path: string) => `attrib +s +h ${path} /S /D`
    },
    validateIcon (imagePath: string): Promise<Buffer> {
      return new Promise(async (resolve, reject) => {
        const img = await Jimp.read(imagePath)
        img.cover(256, 256, async (err, img) => {
          if (err) return reject(err)
          resolve(await img.getBufferAsync(Jimp.MIME_PNG))
        })
      })
    },
    async convertIcon (path: string): Promise<Buffer> {
      const buff = await this.validateIcon(path)
      return toIco(buff)
    },
    hideFile (path: string): Promise<void> {
      return new Promise((resolve, reject) => {
        exec(this.guidelines.setSysProtectedCmd(path), err => err ? reject(err) : resolve())
      })
      // ... TODO MAKE THIS GLOBALLY AVAILABLE
    },
    async makeIcon (path: string, buff: Buffer): Promise<void> {
      await fs.writeFile(path, buff)
      await this.hideFile(path)
    },
    async createIniFile (path: string): Promise<void> {
      const inipath = PATH.join(path, this.guidelines.iniName)
      if (await utils.pathDoesExist(inipath))
        if ((await fs.readFile(inipath, 'utf-8')).includes(this.guidelines.iconInIniTest)) return

      await fs.writeFile(inipath, this.guidelines.iniContents, 'utf16le')
      // await utils.link('C:/Users/Temp/Music/SB/template.ini', inipath)
      await this.hideFile(inipath)
    },
    async set (folderPath: string, imagePath: string): Promise<void> {
      if (!folderPath) throw new Error('NO FOLDER PATH')
      if (!imagePath) throw new Error('NO ICON PATH')
      const finalIconPath = PATH.join(folderPath, this.guidelines.iconName)

      await this.remove(folderPath)
      const buff = await this.convertIcon(imagePath)
      await this.makeIcon(finalIconPath, buff)
      await this.createIniFile(folderPath)
    },
    async test (path) {
      if (!path) throw new Error('NO PATH')

      const { iconName, iniName, iconInIniTest } = this.guidelines
      const join = (p: string) => PATH.join(path, p)
      const exists = async (p: string) => utils.pathDoesExist(join(p))

      if (!await exists(iconName)) return false
      if (!await exists(iniName)) return false

      return (await fs.readFile(join(iniName))).includes(iconInIniTest)
    },
    async remove (path) {
      await utils.unlinkSafe(PATH.join(path, this.guidelines.iniName))
      await utils.unlinkSafe(PATH.join(path, this.guidelines.iconName))
    }
  },
  [Platform.linux]: {
    // TODO mplmement
    async set (path, imageTempPath) {
    },
    async test (path) {
      return false
    },
    async remove (path) {
    }
  }
}
