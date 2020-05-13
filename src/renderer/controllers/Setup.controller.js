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
  get controllers () {
    return getVueInstance().$controllers
  }
}
const SetupController = {
  async login () {
    const listenerId = uuid()
    vue.ipc.once(listenerId, (e, error) => {
      console.log('aber on login', error)
    })
    vue.ipc.send('LOGIN', {listenerId})
  }
}

export default SetupController
