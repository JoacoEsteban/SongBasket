const fs = require('fs')
const v8 = require('v8')
v8.setFlagsFromString('--no-lazy')

const bytenode = require('bytenode')
const input = './dist/electron/main.js'
const output = './dist/electron/main.jsc'
bytenode.compileFile(input, output)

fs.copyFileSync('./build-scripts/bytecode-electron-runner.js', input)
