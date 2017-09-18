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

class TextParser {
  constructor ({ dir_in, dir_out }) {
    const files = fs.readdirSync(dir_in)

    Object.assign(this, {
      dir_in,
      dir_out,
      files
    })
  }
  init () {
    const ret = []
    debug(`Reading ${this.files} from poems-dir:::${this.dir_in}`)
    this.files.forEach( file => {
      const 
        fpath = path.join(this.dir_in, file),
        fdata = this.fileContents(fpath),
        json = this.toJSON({ fdata, fpath })
      ;
      debug(json)
      this.save(file, json)
      ret.push(json)
    })
    return ret
  }
  fileContents (fpath) {
    debug(`Reading file:::${fpath}`)
    return fs.readFileSync(fpath, { encoding: 'utf8' })
  }
  save (file, data) {
    fs.writeFileSync(path.join(this.dir_out, file + '.json'), JSON.stringify(data))
  }
  toJSON ({ fdata, fpath }) {
    return {
      title: path.basename(fpath, path.extname(fpath)),
      data: fdata
    }
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

module.exports = {
  TextParser,
  axe ({ dirs, file, vars } = {}) {
    debug(vars)
    if (file) {
      debug(`Building file ${file}.`)
      AxeUtil.build({ file, vars })
      return
    }
    dirs.forEach( dir => {
      const files = fs.readdirSync(dir).filter( file => axeRegex.test(file) )
      files.forEach( file => {
        file = path.join(dir, file)
        debug(`Building file ${file}.`)
        AxeUtil.build({ file, vars })
      })
    })
  },
  text (textParser) {
    return textParser.init() 
  }
}



