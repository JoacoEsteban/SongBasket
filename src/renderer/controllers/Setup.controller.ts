// @ts-nocheck

import env from './VueInstance'

const SetupController = {
  async setHomeFolder () {
    console.log('sendin')
    let canAdvance = true
    const { isLogged, error } = await env.ipc.callMain('HOME_FOLDERS:ASK')

    if (error) {
      if (error.message !== 'CANCELLED') throw error
      else canAdvance = false
    } else canAdvance = !isLogged

    return canAdvance
  },
  async login () {
    await env.ipc.callMain('LOGIN')
    env.router.push('home')
    env.ipc.callMain('WINDOW:UNLOCK')
  }
}

export default SetupController
