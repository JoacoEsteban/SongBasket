import * as utils from '../../MAIN_PROCESS_UTILS'
import youtubeDl from 'youtube-dl'
import * as PATH from 'path'
import { promises as fs, createWriteStream } from 'fs'
import axios from 'axios'

class YoutubeDlVersionManager {
  apiUrl = 'https://api.github.com/repos/ytdl-org/youtube-dl/releases/latest'
  fetch = axios.get
  binariesPath = global.CONSTANTS.YTDL_BINARIES_PATH
  versionControlPath = global.CONSTANTS.YTDL_VERSION_CONTROL_PATH
  assetName = ({
    windows: 'youtube-dl.exe',
    mac: 'youtube-dl',
    linux: 'youtube-dl'
  })[global.CONSTANTS.PLATFORM]

  // constructor () { }

  async findLocalVersion () {
    try {
      console.log('Finding youtube-dl local version info')
      this.localVersion = JSON.parse(await fs.readFile(this.versionControlPath, 'utf8'))
    } catch (error) {
      this.localVersion = null
    }

    const jsonExists = !!this.localVersion
    const binaryExists = await global.pathExists(this.getBinaryPath())

    if (jsonExists ? !binaryExists : binaryExists) { // XOR
      console.log('youtube-dl ' + (jsonExists ? 'Binary' : 'JSON') + ' doesn\'t exist, wiping both')
      await this.wipeAll()
    }

    this.localVersion && console.log('youtube-dl local version is', this.localVersion.id)
  }

  async wipeVersionInfo () {
    fs.unlink(this.versionControlPath).catch(global.emptyFn)
    this.localVersion = null
  }

  async wipeBinary (binaryPath = this.getBinaryPath()) {
    fs.unlink(binaryPath).catch(global.emptyFn)
  }

  async wipeAll (binaryPath) {
    await Promise.all([
      this.wipeVersionInfo(),
      this.wipeBinary(binaryPath)
    ])
  }

  async findLatestVersion () {
    console.log('Finding youtube-dl latest version info')
    try {
      this.latestVersion = (await this.fetch(this.apiUrl))?.data
    } catch (error) {
      this.latestVersion = null
      console.error('UNABLE TO RETRIEVE LATEST YOUTUBE-DL VERSION:\n', error)
    }
    this.latestVersion && console.log('youtube-dl latest version is', this.latestVersion.id)
  }
  async writeLocalVersion () {
    await fs.writeFile(this.versionControlPath, JSON.stringify(this.latestVersion))
    this.localVersion = this.latestVersion
  }
  // ------------------------------------------
  async findData () {
    const stack = []
    if (!this.latestVersion) stack.push(this.findLatestVersion)
    if (!this.localVersion) stack.push(this.findLocalVersion)
    await Promise.all(stack.map(fn => fn.bind(this)()))
  }
  async hasUpdates () {
    await this.findData()
    return this.localVersion?.id !== this.latestVersion?.id
  }
  // ---------------------
  getBinaryPath (asset = this.getLocalAsset()) {
    return asset && PATH.join(this.binariesPath, asset.name)
  }
  getLocalAsset () {
    return this.localVersion?.assets.find(({ name }) => name === this.assetName)
  }
  getLatestAsset () {
    return this.latestVersion?.assets.find(({ name }) => name === this.assetName)
  }

  async update () {
    console.log('about to update youtube-dl from', this.localVersion?.id || '?', 'to', this.latestVersion.id)
    const asset = this.getLatestAsset()
    if (!asset) throw new Error('YOUTUBE-DL RELEASE ASSET NOT FOUND')

    const binaryPath = this.getBinaryPath(asset)
    await Promise.all([
      utils.createDirRecursive(this.binariesPath),
      this.wipeBinary(binaryPath)
    ])

    const writer = createWriteStream(binaryPath)
    axios({
      method: 'get',
      url: asset.browser_download_url,
      responseType: 'stream'
    }).then(res => res.data.pipe(writer))

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    console.log('youtube-dl binaries downloaded')
    await this.writeLocalVersion()

    // SET EXECUTION PERMISSIONS
    try {
      await this.setExecutionPermissions()
    } catch (error) {
      await this.wipeAll(binaryPath)
    }
  }

  async setExecutionPermissions () {
    if (global.CONSTANTS.PLATFORM !== 'windows') {
      try {
        console.log('setting execution permissions to yt-dl binary')
        const binPath = this.getBinaryPath()
        if (!binPath) throw new Error('NO BINARY PATH')
        await new Promise((resolve, reject) => global.sudo.exec('chmod +x ' + `"${binPath}"`, { name: 'SongBasket' }, error => error ? reject(error) : resolve()))
        console.log('execution permissions set to yt-dl binary')
      } catch (error) {
        console.error('ERROR SETTING EXECUTION PERMISSIONS', error)
        throw error
      }
    }
  }
  async checkNUpdate () {
    if (await this.hasUpdates()) await this.update()
    else console.log('youtube-dl is up to date')

    this.updateLibraryPaths()
  }
  updateLibraryPaths () {
    console.log('\n\nsetting youtube binary ', this.getBinaryPath())
    youtubeDl.setYtdlBinary(this.getBinaryPath())
  }
}

export default YoutubeDlVersionManager
