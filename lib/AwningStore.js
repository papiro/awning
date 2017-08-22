'use strict'

const
  path = require('path'), fs = require('fs')
,
  EventEmitter = require('events')
,
  util = require('util'),
  debug = util.debuglog('awning.store')
,
  _ = require('_private')
,
  storesByFile = {}
;

module.exports = class AwningStore extends EventEmitter {
  constructor ({ file }) {
    super()

    const useFile = (file !== undefined)

    let filePath, fileContents
    if (useFile) {
      filePath = path.resolve(app.root, file)
      // If the file is already open by another store, just return that instance.
      if (storesByFile.hasOwnProperty(filePath)) { return storesByFile[filePath] }

      storesByFile[filePath] = this

      try {
        fileContents = fs.readFileSync(filePath, { encoding: 'utf8' })
      } catch (e) {
        // If the file doesn't exist, we're about to create it in the next few lines.
        if (!~e.message.indexOf('ENOENT')) throw e
      }
      file = fs.createWriteStream(filePath, { 
        flags: 'w', 
        defaultencoding: 'utf8',
        autoclose: false
      })
    }

    // Public properties
    Object.assign(this, {
      path: filePath
    })
      
    // Private properties
    Object.assign(_(this), {
      file,
      // Populate in-memory store with persisted data if it exists
      store: fileContents ? JSON.parse(fileContents) : {}
    })

    debug(`Store being instantiated...${this.file ? 'With accompanying file:::' + this.file.path : ''}.`)

    file && file.on('error', (err) => {
      this.emit('error', err)
    })
  }

  get (key) {
    if (key === undefined) {
      return _(this).store 
    } else {
      return _(this).store[key]
    }
  }

  get obj () {
    return _(this).store
  }

  set obj (val) {
    _(this).store = val
  }

  set (key, val) {
    _(this).store[key] = val
  }

  persist (key, val) {
    this.set(key, val)
    _(this).file.write(JSON.stringify(_(this).store))
  } 
}
