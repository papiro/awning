'use strict'

const
  fs = require('fs'),
  path = require('path')
,
  debuglog = require('util').debuglog,
  debug = new debuglog('awning.build')
,
  axeRegex = /\.axe\.css$/,
  parseVarsRegex = /^\+(\w*) *(\S*)/gm
;

module.exports = {
  axe ({ axe, file, vars } = {}) {
    debug(vars)
    if (file) {
      debug(`Building file ${file}.`)
      AxeUtil.build({ file, vars })
      return
    }
    const files = fs.readdirSync(axe).filter( file => axeRegex.test(file) )
    files.forEach( file => {
      file = path.join(axe, file)
      debug(`Building file ${file}.`)
      AxeUtil.build({ file, vars })
    })
  },
  poems ({ dir_in, dir_out }) {
    const files = fs.readdirSync(dir_in)
    debug(`Reading ${files} from poems-dir:::${dir_in}`)
    files.forEach( file => {
      const json = PoemParser.toJSON(path.join(dir_in, file))
      debug(json)
      fs.writeFileSync(path.join(dir_out, file + '.json'), JSON.stringify(json))
    })
  }
}

class PoemParser {
  static fileContents (fpath) {
    debug(`Reading file:::${fpath}`)
    return fs.readFileSync(fpath, { encoding: 'utf8' })
  }
  static toJSON (fpath) {
    const schema = {
      title: path.basename(fpath, path.extname(fpath)),
      body: String,
      dump: String
    }

    return Object.assign({}, schema, {
      dump: PoemParser.fileContents(fpath)
    })
  }
}

class AxeUtil {
  static build ({ file, vars = {} }) {
    debug('----------------')
    debug(file)
    debug(vars)

    let data
    // Somehow this try catch solves a very frustrating and mysterious issue (I think caused by Vim).
    // An ENOENT occurs even though the file is openly being edited.
    try {
      data = fs.readFileSync(file, { encoding: 'utf8' })
    } catch (e) {
      // Essentially doing nothing.
      return
    }
    data = this.parseVars(data, vars)
    fs.writeFileSync(file.replace(axeRegex, '.css'), data.trim())
  }

  static parseVars (data, vars = {}) {
    let match
    while((match = parseVarsRegex.exec(data)) !== null) {
      const [raw, key, value ] = match
      debug(`${key}:::${value} found in `)
      vars[key] = value
    }
    const varsRegex = new RegExp(Object.keys(vars).join('|'), 'g')
    const newData = data.replace(varsRegex, (key) => {
      return vars[key]
    })
    // Slough off variable definitions.
    return newData.split('\n').filter( l => (l[0] !== '+') ).join('\n')
  }
}


