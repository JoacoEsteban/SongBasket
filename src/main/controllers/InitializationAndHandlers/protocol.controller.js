const paths = global.CONSTANTS.PROTOCOL_PATHS

const CBS = {
  'auth': (url) => console.log('auth', url)
}

const getUrl = url => {
  if (!url) return
  url = decodeURI(url)
  const full = decodeURI(url.replace(new RegExp(paths.BASE + '://', 'g'), ''))
  const base = (full.indexOf('?') !== -1 && full.slice(0, full.indexOf('?'))) || null

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
      this.cbs.forEach(cb => cb(args))
    }
  }
  if (!Array.isArray(cbs.cbs)) cbs.cbs = [cbs.cbs]
  if (!cbs.cbs.length) return null

  return cbs
}

export default {
  startProtocols,
  on
}

function startProtocols (electron) {
  const protocol = electron.protocol
  protocol.registerHttpProtocol(paths.BASE, onRequest)
}

function onRequest (req, cb) {
  const parsed = getUrl(req.url)
  const actualCb = getCb(parsed)
  actualCb && actualCb.callAll(parsed)
}

function on () {
}
