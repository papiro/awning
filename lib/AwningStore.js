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
,
  dateUtils = require('awning').utils.date
;

module.exports = class AwningStore extends EventEmitter {
  constructor ({ file, frequency = 60000 } = {}) {
    super()

    if (file === undefined) {
      debug('Store being instantiated without file.')
      _(this).store = {}
      return
    }

    const filePath = AwningStore.resolveFilePath(file)    
    debug(`Using file:::${filePath}`)
    // If the file is already being used by another store, just return that instance.
    if (storesByFile.hasOwnProperty(filePath)) { 
      debug('File already open by another store, so returning existing instance') 
      return storesByFile[filePath] 
    }

    storesByFile[filePath] = this

    let store = {}
    this.populateStoreFromFile(store, filePath)

    // Public properties
    Object.assign(this, {
      path: filePath,
      frequency,
      busy: false
    })
      
    // Private properties
    Object.assign(_(this), {
      store
    })

    // Set up saving interval.
    setInterval(this.persistStore.bind(this), this.frequency)

    // Trap for process exit.
    process.once('exit', () => {
      this.persistStore({ sync: true })
    })
  }

  populateStoreFromFile (store, filePath) {
    let fileContents
    try {
      fileContents = fs.readFileSync(filePath, { encoding: 'utf8' })
    } catch (e) {
      // If the file doesn't exist, it's fine.
      if (!~e.message.indexOf('ENOENT')) throw e
    }

    if (fileContents) {
      // Populate in-memory store with persisted data if it exists
      Object.assign(store, JSON.parse(fileContents))
      debug(`Populating in-memory store with file-contents:::${fileContents}.`)
    } else {
      debug('No file-contents.')
    }
  }

  persistStore ({ filePath = this.path, sync = false } = {}) {
    debug(`Persisting store to ${filePath}.`)
    if (this.busy) { return }
    this.busy = true
    fs[`writeFile${sync ? 'Sync' : ''}`](filePath, JSON.stringify(_(this).store), err => {
      this.busy = false  
      if (err) throw err
      debug(`Successfully saved to ${filePath}.`)
    })
  }

  get (key) {
    if (key === undefined) {
      return _(this).store 
    } else {
      return _(this).store[key]
    }
  }

  set (key, val) {
    _(this).store[key] = val
  }

  // Sets a value to a key, only if one doesn't already exist.
  default (key, val) {
    if (_(this).store[key] === undefined) {
      this.set(key, val)
    }
  }

  static getStoreByFile (fileName) {
    return storesByFile[AwningStore.resolveFilePath(fileName)]
  }

  static resolveFilePath (file) {
    return path.isAbsolute(file) ? file : path.resolve(app.root, file)
  }

}
