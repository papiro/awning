// TODO: make server_scripts able to run asychronously

'use strict'

const 
  path = require('path'),
  fs = require('fs'),
  vm = require('vm'),

  tag = 'server_script'

let
  sandbox = { path, fs, console },
  sandboxOptions = { displayErrors: true }
;

module.exports = function render (req, res, done) {
  if (req.url === null || path.extname(req.url) !== '.jsml') return done()

  const pathToIndex = path.join(res.mount, req.url)
  fs.readFile(pathToIndex, { encoding: 'utf8' }, (err, jsml) => {
    if (err) {
      console.log(err)
      return res.emit(500, err)
    }

    // give the client code a reference to its own location
    sandbox.root = res.mount
    
    if (~jsml.indexOf(`<${tag}>`)) {
      const tagMatcher = new RegExp(`<${tag}>[\\s\\S]*?<\/${tag}>`, 'g')
      const scriptMatcher = new RegExp(`(?:<${tag}>)([\\s\\S]*)(?:<\/${tag}>)`)
      let rendered = jsml
      let cyclic = []
      while ((cyclic = tagMatcher.exec(jsml)) !== null) {
        const script = cyclic[0].match(scriptMatcher)[1]
        const preppedScript = 
        // wrap vm'd script in IIFE to disconnect it from calling globals, thereby
        // significantly improving performance (beyond even that of eval)
        `
        (() => ${script} )()
        `
        const output = vm.runInNewContext(preppedScript, sandbox, sandboxOptions)
        rendered = rendered.replace(cyclic[0], output)          
      }
      fs.writeFile(`${pathToIndex}.html`, rendered, (err) => {
        // TODO: use fs.mkdtemp and write this into a temporary directory
        // just throw for now
        if (err) throw err
        req.url += '.html'
        done()
      })
    }
  })
}
