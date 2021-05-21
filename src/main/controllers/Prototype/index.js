import path from 'path'

(r => {
  const currentFile = path.basename(__filename)
  r.keys().filter(key => !key.includes(currentFile)).forEach(r)
})(require.context('.', true, /\.js$/))
