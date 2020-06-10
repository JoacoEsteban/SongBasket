'use strict'
require('dotenv-flow').config()
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

builder.build({
  // '-c.mac.identity': null,
  publish: 'onTag',
  // publish: 'always',
  // targets: Platform.WINDOWS.createTarget(),
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
      target: [
        'dmg',
        'zip'
      ],
      publish: [
        'github'
      ]
    },
    win: {
      icon: 'assets/icons/songbasket.ico'
    },
    linux: {
      icon: 'assets/icons/songbasket.png'
    }
  }
})
  .then(() => {
    // handle result
  })
  .catch(error => {
    // handle error
    console.error(error)
  })
