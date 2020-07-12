let VueInstance

const env = {
  get instance () {
    return VueInstance || (VueInstance = require('../main').default)
  },
  get ipc () {
    return this.instance.$IPC
  },
  get root () {
    return this.instance.$root
  },
  get store () {
    return this.instance.$store
  },
  get controllers () {
    return this.instance.$controllers
  },
  get sbRouter () {
    return this.instance.$sbRouter
  }
}

export default env
