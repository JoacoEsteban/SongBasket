export function cloneObject (aObject) {
  return clone(aObject)
}
function clone (aObject) {
  if (!aObject) {
    return aObject
  }

  let v
  let bObject = Array.isArray(aObject) ? [] : {}
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = (typeof v === 'object') ? clone(v) : v
  }

  return bObject
}

export function removeDuplication (array) {
  if (!Array.isArray(array)) return
  for (let i = 0; i < array.length; i++) {
    array = [array[i], ...array.filter(item => item !== array[i])]
  }
  return array
}