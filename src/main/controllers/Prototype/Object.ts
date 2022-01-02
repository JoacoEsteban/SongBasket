declare interface ObjectConstructor {
  isObject: (obj: any) => boolean,
  isSameObject: (obj: Object) => boolean,
}

Object.defineProperty(Object, 'isObject', function (object: any) {
  return !!object && typeof object === 'object' && !Array.isArray(object)
})

Object.defineProperty(Object.prototype, 'isSameObject', function (this: {
  [key: string]: any,
}, object: {
  [key: string]: any,
}) {
  if (!this) throw new TypeError()
  if (!object) return false

  if (this === object) return true

  const myKeys = Object.keys(this)
  const theirKeys = Object.keys(object)
  if (myKeys.length !== theirKeys.length) return false

  const isDifferent = myKeys.some(key => {
    if (!object.propertyIsEnumerable(key)) return true
    const myVal = this[key]
    const theirVal = object[key]

    if (typeof myVal !== typeof theirVal) return true
    if (myVal !== theirVal) {
      if (Object.isObject(myVal) && Object.isObject(theirVal)) return !myVal.isSameObject(theirVal)
      return true
    }
  })

  return !isDifferent
})
