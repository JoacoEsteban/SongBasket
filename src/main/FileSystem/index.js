const electron = require('electron')
const path = require('path')
var fs = require('fs')
const userDataPath = (electron.app || electron.remote.app).getPath('userData') + '/songbasket/'
const userJSONPath = userDataPath + 'userdata.json'

let userMethods = {
    checkForUser: function(){
        let user
            
        if(fs.existsSync(userDataPath)){
            user = fs.readFileSync(userJSONPath, 'utf8')
            console.log(user)
            return JSON.parse(user)
        }else{
            console.log('Folder missing, Creating')
            fs.mkdirSync(userDataPath)
            let userJSON = JSON.stringify({user: 'joaqo.esteban', logged: false})
            fs.writeFileSync(userJSONPath, userJSON, 'utf8')
            
            this.checkForUser()
        }
        
    }
}

export default userMethods