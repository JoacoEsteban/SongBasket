'use strict'
require('dotenv-flow').config()
const fs = require('fs')
const PATH = require('path')

const builder = require('electron-builder')
const Platform = builder.Platform
const currentPlatform = (() => {
  switch (process.platform) {
    case 'darwin':
      return 'MAC'
    default:
      if (process.platform.includes('win')) return 'WINDOWS'
      return 'LINUX'
  }
})()

const targets = {
  win: [
    'appx',
    'nsis'
  ],
  mac: [
    'dmg',
    'zip'
  ]
}

const shouldSignAppx = currentPlatform === 'WINDOWS'
const shouldPublish = process.env.VAR_PUBLISH ? 'always' : 'onTag'

const CONFIG = {
  publish: shouldPublish,
  targets: Platform[currentPlatform].createTarget(),
  config: {
    asar: false,
    productName: 'SongBasket',
    appId: 'com.joacoesteban.songbasket',
    directories: {
      output: 'build'
    },
    files: [
      'dist/electron/**/*',
      'node_modules/fileicon',
      'node_modules/youtube-dl'
    ],
    mac: {
      icon: 'assets/icons/songbasket.icns',
      target: targets.mac,
      publish: [
        'github'
      ]
    },
    win: {
      icon: 'assets/icons/songbasket.ico',
      target: targets.win,
      publish: [
        'github'
      ]
    },
    appx: {
      identityName: process.env.IDENTITY_NAME,
      applicationId: process.env.APPLICATION_ID,
      publisher: process.env.PUBLISHER,
      publisherDisplayName: process.env.PUBLISHER_DISPLAY_NAME,
      backgroundColor: '#151515'
    },
    linux: {
      icon: 'assets/icons/songbasket.png'
    }
  }
}
builder.build(CONFIG)
  .then(paths => {
    if (currentPlatform === 'WINDOWS' && targets.win.includes('appx') && shouldSignAppx) signAppx(paths)
  })
  .catch(error => {
    console.error(error)
  })

function signAppx (paths) {
  const base = process.cwd()
  const buildPath = PATH.join(base, 'build')
  const appxPath = paths.find(p => p.includes('.appx'))

  const signedAppxName = PATH.relative(buildPath, appxPath).replace('.appx', '_SIGNED.appx').replace(/ /g, '-')
  const signedAppxPath = PATH.join(buildPath, signedAppxName)

  console.log('ABOUT TO SELF-SIGN APPX')
  fs.copyFile(appxPath, signedAppxPath, err => {
    if (err) return console.error('ERROR COPYING APPX FOR CERTIFICATION: ', err)
    const signToolPath = 'C:\\"Program Files (x86)"\\"Windows Kits"\\10\\"App Certification Kit"\\signtool.exe'
    const certPath = PATH.join(__dirname, 'certs', 'self-cert.pfx') + ' /p pass'
    const command = `${signToolPath} sign /fd SHA256 /a /f ${certPath} ${signedAppxPath}`
    require('child_process').exec(command, (err, out) => {
      err && console.error(err)
      !err && console.log('\n----Certification Successfull----\n', out)
    })
  })
}
