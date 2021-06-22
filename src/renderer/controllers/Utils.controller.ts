const Utils = {
  minsFromSecs (total: number) {
    const x = total / 60
    const mins = Math.floor(x)
    const secs = Math.floor((x - mins) * 60)
    return `${(mins < 10 ? '0' : '') + mins}:${(secs < 10 ? '0' : '') + secs}`
  }
}

export default Utils
