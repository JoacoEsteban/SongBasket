Object.defineProperty(Array.prototype, 'lastIndex', {
  get () {
    return this.length ? this.length - 1 : null
  }
})
Object.defineProperty(Array.prototype, 'last', {
  get () {
    return this[this.lastIndex]
  }
})
Object.defineProperty(Array.prototype, 'head', {
  get () {
    return this[0]
  }
})
