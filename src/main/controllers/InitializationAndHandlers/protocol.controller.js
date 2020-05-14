const paths = global.CONSTANTS.PROTOCOL_PATHS

const CBS = {
}

const getUrl = url => {
  if (!url) return
  url = decodeURI(url)
  const full = decodeURI(url.replace(new RegExp(paths.BASE + '://', 'g'), ''))
  const base = (full.indexOf('?') !== -1 && full.slice(0, full.indexOf('?'))) || full

  const arg = '?payload='
  const payload = full.indexOf(arg) !== -1 && JSON.parse(full.substring(full.indexOf(arg) + arg.length))

  return {
    full,
    base,
    payload
  }
}

const getCb = path => {
  const cbs = {
    cbs: CBS[path.base] || [],
    callAll (...args) {
      this.cbs.forEach(fn => fn(...args))
    }
  }
  if (!Array.isArray(cbs.cbs)) cbs.cbs = [cbs.cbs]
  if (!cbs.cbs.length) return null

  return cbs
}

export default {
  startProtocols,
  on,
  off
}

function startProtocols (electron) {
  const protocol = electron.protocol
  protocol.registerHttpProtocol(paths.BASE, onRequest)
}

function onRequest (req, cb) {
  const parsed = getUrl(req.url)
  console.log('----> ' + parsed.base)
  const actualCb = getCb(parsed)
  actualCb && actualCb.callAll(parsed)
}

function on (path, cb) {
  if (!path) throw new Error('PATH NOT SPECIFIED')
  if (typeof cb !== 'function') throw new Error('INVALID CALLBACK')

  let stack = CBS[path]
  if (!stack) stack = CBS[path] = []
  else if (stack.some(fn => fn === cb)) return console.error('CALLBACK ALREADY ATTACHED')
  stack.push(cb)

  return true
}

function off (path, cb) {
  if (!path) throw new Error('PATH NOT SPECIFIED')
  if (typeof cb !== 'function') throw new Error('INVALID CALLBACK')

  let stack = CBS[path]
  if (!stack || !stack.length) return console.error('CALLBACK STACK IS EMPTY')
  CBS[path] = stack.filter(fn => fn !== cb)

  return true
}
