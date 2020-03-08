export default class {
  constructor () {
    this.path = {name: '', params: {}}
    this.history = []
    this.pointer = -1
    this.beforeTransitionCallbacks = []
    this.afterTransitionCallbacks = []
  }

  beforeTransition (func) {
    this.beforeTransitionCallbacks.push(func)
  }
  afterTransition (func) {
    this.afterTransitionCallbacks.push(func)
  }

  giveMeCurrent () {
    return this.history[this.pointer]
  }

  isSamePath (path) {
    return path.name === this.path.name && Object.keys(this.path).length !== Object.keys(path).length && ((env) => {
      for (const key in env.path) if (env.path[key] !== path[key]) return false
      return true
    })(this)
  }

  isLast () {
    return this.pointer + 1 === this.history.length
  }

  clearHistory () {
    this.history = this.history.slice(0, this.pointer + 1)
  }

  async push (location) {
    if (typeof location === 'string') location = {name: location, params: {}}
    if (this.isSamePath(location)) return console.error('Same Path')

    await this.onBeforeTransition(location) // To
    this.clearHistory()
    this.history.push(location)
    this.pointer++
    this.path = location
    this.onAfterTransition(this.history[this.history.length - 2]) // From
  }

  goBack () {
    if (this.pointer === 0) return
    this.onBeforeTransition(this.history[this.pointer - 1]) // To
    this.pointer--
    this.path = this.giveMeCurrent()
    this.onAfterTransition(this.history[this.pointer + 1]) // From
  }

  goForward () {
    if (this.isLast()) return
    this.onBeforeTransition(this.history[this.pointer + 1]) // To
    this.pointer++
    this.path = this.giveMeCurrent()
    this.onAfterTransition(this.history[this.pointer - 1]) // From
  }

  async onBeforeTransition (to) {
    // (to, from)
    this.beforeTransitionCallbacks.forEach(async f => f(to, this.path))
  }
  async onAfterTransition (from) {
    // (on, from)
    this.afterTransitionCallbacks.forEach(async f => f(this.path, from))
  }
}
