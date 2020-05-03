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
Object.defineProperty(Array.prototype, 'indexOfSearch', {
  get () {
    return function (cb) {
      for (let i = 0; i < this.length; i++) {
        if (cb(this[i], i, this)) return i
      }
      return -1
    }
  }
})
Object.defineProperty(Array.prototype, 'lastIndexOfSearch', {
  get () {
    return function (cb) {
      for (let i = this.length - 1; i > -1; i--) {
        if (cb(this[i], i, this)) return i
      }
      return -1
    }
  }
})
