export type locationEntry = { name: string, params: {} }
export type transitionCallback = (to: locationEntry, from: locationEntry) => void
class SbRouter {
  path: locationEntry = { name: '', params: {} }
  history: locationEntry[] = []
  pointer = -1
  beforeTransitionCallbacks: transitionCallback[] = []
  afterTransitionCallbacks: transitionCallback[] = []
  transitioning: boolean = false

  beforeTransition (func: transitionCallback) {
    this.beforeTransitionCallbacks.push(func)
  }
  afterTransition (func: transitionCallback) {
    this.afterTransitionCallbacks.push(func)
  }

  setTransitioningState (bool: boolean) {
    return this.transitioning = bool
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

  isSamePath (path1: locationEntry, path2 = this.path) {
    return path1.isSameObject(path2)
  }

  isLast () {
    return this.pointer + 1 === this.history.length
  }

  clearHistory () {
    this.history = this.history.slice(0, this.pointer + 1)
  }

  async push (location: locationEntry | string): Promise<void> {
    if (this.transitioning) return
    if (typeof location === 'string') location = { name: location, params: {} }

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

  async onBeforeTransition (to: locationEntry) {
    // (to, from)
    this.beforeTransitionCallbacks.forEach(f => f(to, this.path)) // TODO await Promise.all
  }
  async onAfterTransition (from: locationEntry) {
    // (on, from)
    this.afterTransitionCallbacks.forEach(f => f(this.path, from)) // TODO await Promise.all
  }
}

export default SbRouter
