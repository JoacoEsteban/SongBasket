const electron = require('electron')
var fs = require('fs')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/songbasket/'
const userJSONPath = userDataPath + 'userdata.json'

let userMethods = {
  checkForUser: function () {
    let user

    if (fs.existsSync(userDataPath)) {
      user = fs.readFileSync(userJSONPath, 'utf8')
      console.log('EXISTS', user)
      return JSON.parse(user)
    } else {
      console.log('Folder missing, Creating')
      fs.mkdirSync(userDataPath)
      let userJSON = JSON.stringify({user: 'joaqo.esteban', logged: false})
      fs.writeFileSync(userJSONPath, userJSON, 'utf8')

      this.checkForUser()
    }
  },
  setHomeFolder: function ({state, path}) {
    return new Promise((resolve, reject) => {
      let jsonState = JSON.stringify(state)
      console.log('PATHH', Date.now())
      fs.writeFile(path + '/.songbasket', jsonState, 'utf8', (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

export default userMethods
