const bytenode = require('bytenode')
const path = require('path').join(__dirname, '/main.jsc')
bytenode.runBytecodeFile(path)
