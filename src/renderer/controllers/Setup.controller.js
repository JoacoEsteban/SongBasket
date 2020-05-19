let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const uuid = () => getVueInstance().$uuid()
const vue = {
  get ipc () {
    return getVueInstance().$IPC
  },
  get instance () {
    return getVueInstance()
  },
  get root () {
    return getVueInstance().$root
  },
  get store () {
    return getVueInstance().$store
  },
  get router () {
    return getVueInstance().$router
  },
  get controllers () {
    return getVueInstance().$controllers
  }
}
const SetupController = {
  setHomeFolder () {
    return new Promise((resolve, reject) => {
      const listenerId = uuid()
      console.log('sendin')
      vue.ipc.once(listenerId, (e, {isLogged, error}) => {
        console.log('response')
        if (error) return error.message !== 'CANCELLED' ? reject(error) : null
        if (!isLogged) resolve()
      })
      vue.ipc.send('HOME_FOLDERS:ASK', {listenerId})
    })
  },
  login () {
    const listenerId = uuid()
    vue.ipc.once(listenerId, (e, error) => {
      console.log('aber on login', error)
      vue.router.push('home')
      vue.ipc.send('WINDOW:UNLOCK')
    })
    vue.ipc.send('LOGIN', {listenerId})
  }
}

export default SetupController
