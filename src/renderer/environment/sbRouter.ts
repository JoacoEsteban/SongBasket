export default class {
  constructor () {
    this.path = {name: '', params: {}}
    this.history = []
    this.pointer = -1
    this.beforeTransitionCallbacks = []
    this.afterTransitionCallbacks = []
    this.transitioning = false
  }

  beforeTransition (func) {
    if (typeof func === 'function') this.beforeTransitionCallbacks.push(func)
  }
  afterTransition (func) {
    if (typeof func === 'function') this.afterTransitionCallbacks.push(func)
  }

  setTransitioningState (bool) {
    return this.transitioning = !!bool
  }

  giveMeCurrent () {
    return this.history[this.pointer]
  }
  giveMePrevious () {
    return this.history[this.pointer - 1]
  }
  giveMeNext () {
    return this.history[this.pointer + 1]
  }

  isSamePath (path1, path2 = this.path) {
    return path1 && path2 && path1.isSameObject(path2)
  }

  isLast () {
    return this.pointer + 1 === this.history.length
  }

  clearHistory () {
    this.history = this.history.slice(0, this.pointer + 1)
  }

  async push (location) {
    if (this.transitioning) return
    if (typeof location === 'string') location = {name: location, params: {}}
    if (this.isSamePath(location)) return console.error('Same Path')
    if (this.isSamePath(location, this.giveMePrevious())) return this.goBack()
    if (this.isSamePath(location, this.giveMeNext())) return this.goForward()

    await this.onBeforeTransition(location) // To
    this.clearHistory()
    this.history.push(location)
    this.pointer++
    this.path = location
    this.onAfterTransition(this.history[this.history.length - 2]) // From
  }

  goBack () {
    if (this.transitioning) return
    if (this.pointer === 0) return
    this.onBeforeTransition(this.history[this.pointer - 1]) // To
    this.pointer--
    this.path = this.giveMeCurrent()
    this.onAfterTransition(this.history[this.pointer + 1]) // From
  }

  goForward () {
    if (this.transitioning) return
    if (this.isLast()) return
    this.onBeforeTransition(this.history[this.pointer + 1]) // To
    this.pointer++
    this.path = this.giveMeCurrent()
    this.onAfterTransition(this.history[this.pointer - 1]) // From
  }

  async onBeforeTransition (to) {
    // (to, from)
    this.beforeTransitionCallbacks.forEach(f => f(to, this.path))
  }
  async onAfterTransition (from) {
    // (on, from)
    this.afterTransitionCallbacks.forEach(f => f(this.path, from))
  }
}
