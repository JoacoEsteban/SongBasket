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
Object.defineProperty(Array.prototype, 'asyncForEach', {
  get () {
    return async function (cb) {
      for (let i = 0; i < this.length; i++) {
        await cb(this[i], i, this)
      }
    }
  }
})
Object.defineProperty(Array.prototype, 'asyncFilter', {
  get () {
    return async function (cb) {
      const cloned = [...this]
      for (let i = 0; i < cloned.length; i++) {
        if (!await cb(cloned[i], i, cloned)) cloned.splice(i--, 1)
      }
      return cloned
    }
  }
})

module.exports = {}
