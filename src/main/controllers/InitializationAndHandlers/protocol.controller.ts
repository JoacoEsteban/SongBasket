import * as electron from 'electron'

type UrlDecomposed = {
  full: string,
  base: string, // TODO rename to path
  payload: any
}

const paths = global.CONSTANTS.PROTOCOL_PATHS

const CBS: {
  [key: string]: Function[]
} = {}

const getUrl = (url: string): UrlDecomposed => {
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

const getCb = (path: UrlDecomposed) => {
  const cbs = {
    cbs: CBS[path.base] || [],
    callAll (...args: any[]) {
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

function startProtocols () {
  const protocol = electron.protocol
  protocol.registerHttpProtocol(paths.BASE, onRequest)
}

function onRequest (req: electron.Request) {
  const parsed = getUrl(req.url)
  console.log('----> ' + parsed.base)
  const actualCb = getCb(parsed)
  actualCb && actualCb.callAll(parsed)
}

function on (path: string, cb: Function) {
  if (!path) throw new Error('PATH NOT SPECIFIED')
  if (typeof cb !== 'function') throw new Error('INVALID CALLBACK')

  let stack = CBS[path]
  if (!stack) stack = CBS[path] = []
  else if (stack.some(fn => fn === cb)) return console.error('CALLBACK ALREADY ATTACHED')
  stack.push(cb)

  return true
}

function off (path: string, cb: Function) {
  if (!path) throw new Error('PATH NOT SPECIFIED')
  if (typeof cb !== 'function') throw new Error('INVALID CALLBACK')

  let stack = CBS[path]
  if (!stack || !stack.length) return console.error('CALLBACK STACK IS EMPTY')
  CBS[path] = stack.filter(fn => fn !== cb)

  return true
}
