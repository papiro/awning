'use strict'

const
  fs = require('fs'),
  path = require('path')
,
  debuglog = require('util').debuglog,
  debug = new debuglog('awning.build')
,
  axeRegex = /\.axe\.css$/
;

module.exports = function ({ axe, file } = {}) {
  if (file) {
    readParseWrite(file)
    return
  }
  const files = fs.readdirSync(axe).filter( file => axeRegex.test(file) )
  files.forEach( file => {
    readParseWrite(path.join(axe, file))
  })
}

function readParseWrite (file) {
  debug('----------------')
  debug(file)

  let data
  // Somehow this try catch solves a very frustrating and mysterious issue (I think caused by Vim).
  // An ENOENT occurs even though the file is openly being edited.
  try {
    data = fs.readFileSync(file, { encoding: 'utf8' })
  } catch (e) {
    // Essentially doing nothing.
    return
  }
  data = parseVars(data)
  fs.writeFileSync(file.replace(axeRegex, '.css'), data.trim())
}

function parseVars (data) {
  const regex = /^\+(\w*) *(\S*)/gm
  let match
  const keyVals = {}
  while((match = regex.exec(data)) !== null) {
    const [raw, key, value ] = match
    debug(`${key}:::${value}`)
    keyVals[key] = value
  }
  const keyRegex = new RegExp(Object.keys(keyVals).join('|'), 'g')
  const newData = data.replace(keyRegex, (key) => {
    return keyVals[key]
  })
  // Slough off variable definitions.
  return newData.split('\n').filter( l => (l[0] !== '+') ).join('\n')
}
