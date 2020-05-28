'use strict'
require('dotenv-flow').config()
console.log('TOKK', process.env.GH_TOKEN)
const builder = require('electron-builder')
const Platform = builder.Platform

// Promise is returned
builder.build({
  // '-c.mac.identity': null,
  publish: 'onTag',
  targets: Platform.MAC.createTarget(),
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
