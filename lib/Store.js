'use strict'

const
  path = require('path'), fs = require('fs')
,
  util = require('util'),
  debug = util.debuglog('awning.store')
,
  _ = require('_private')
;

class AwningStore {
  constructor ({ file }) {
    const useFile = (file !== undefined)
      
    let fileContents, filePath, file
    if (useFile) {
      fileContents = fs.readFileSync(filePath, { encoding: 'utf8' }),
      filePath = path.resolve(app.root, path),
      file = fs.createWriteStream(filePath, { 
        flags: 'w', 
        defaultencoding: 'utf8',
        autoclose: false
      })
    }
      
    Object.assign(_(this), {
      // Populate in-memory store with persisted data if it exists
      store: fileContents ? JSON.parse(fileContents) : {}
    })


    debug(`Store being instantiated...${this.file ? 'With accompanying file:::' + this.file.path}.`)
    function awningStoreFn (key, val) {
      if (foo === undefined) {
        this.setStore(key, val)
        return _(this).store 
      } else {
        return _(this).store[key]
      } 
    }

    awningStoreFn.prototype = Object.getPrototypeOf(this)

    return awningStoreFn
  }

  setStore (key, val) {
    _(this).store[key] = val
  }

  persist (key, val) {
    this.setStore(key, val)
    this.file.write(JSON.stringify(_(this).store))
  } 
}
