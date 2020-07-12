const env = require('./VueInstance')
const uuid = () => env.instance.$uuid()

const SetupController = {
  setHomeFolder () {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      console.log('sendin')
      env.ipc.once(listenerId, (e, {isLogged, error}) => {
        console.log('response')
        if (error) return error.message !== 'CANCELLED' ? reject(error) : null
        if (!isLogged) resolve()
      })
      env.ipc.send('HOME_FOLDERS:ASK', {listenerId})
    })
  },
  login () {
    const listenerId = uuid()
    env.ipc.once(listenerId, (e, error) => {
      console.log('aber on login', error)
      env.router.push('home')
      env.ipc.send('WINDOW:UNLOCK')
    })
    env.ipc.send('LOGIN', {listenerId})
  }
}

export default SetupController
