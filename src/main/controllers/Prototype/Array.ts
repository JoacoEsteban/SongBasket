type IterationCallback = (item: {}, index: number, array: any[]) => any
type AsyncIterationCallback = (item: {}, index: number, array: any[]) => Promise<any>

Object.defineProperty(Array.prototype, 'lastIndex', {
  get () {
    return this.length - 1
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
Object.defineProperty(Array.prototype, 'indexOfSearch',
  function indexOfSearch (this: any[], cb: IterationCallback): number {
    for (let i = 0; i < this.length; i++) {
      if (cb(this[i], i, this)) return i
    }
    return -1
  })

Object.defineProperty(Array.prototype, 'lastIndexOfSearch',
  function lastIndexOfSearch (this: any[], cb: IterationCallback): number {
    for (let i = this.length - 1; i > -1; i--) {
      if (cb(this[i], i, this)) return i
    }
    return -1
  })

Object.defineProperty(Array.prototype, 'asyncForEachParallel',
  async function (this: any[], cb: AsyncIterationCallback) {
    await Promise.all(this.map(async (item, index) => cb(item, index, this)))
  })

Object.defineProperty(Array.prototype, 'asyncForEach',
  async function (this: any[], cb: AsyncIterationCallback) {
    let i = 0
    for (const item of this) {
      await cb(item, i++, this)
    }
  })

Object.defineProperty(Array.prototype, 'asyncFilter',
  async function (this: any[], cb: AsyncIterationCallback) {
    const filtered = []
    let i = 0
    for (const item of this) {
      if (await cb(item, i, this)) filtered.push(item)
      i++
    }
    return filtered
  })

export default null

