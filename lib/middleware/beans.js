'use strict'

const path = require('path'), fs = require('fs'), vm = require('vm')
,
  tag = 'bean'

let
  sandbox = { path, fs, console, env: process.env },
  sandboxOptions = { displayErrors: true }
;

module.exports = function beans (req, res, done) {
  if (path.extname(req.url) !== '.html') return done()

  // now onto business
  const bnsPath = path.join(res.root, path.dirname(req.url), path.basename(req.url).replace('html', 'bns'))
  console.info(`begin rendering beans file:::${bnsPath}`)
  fs.readFile(bnsPath, { encoding: 'utf8' }, (err, markup) => {
    if (err) {
      console.error(err)
      res.setStatus(500)
      return done(false)
    }

    // give the client code a reference to its own location
    sandbox.root = res.root
    
    if (~markup.indexOf(`<${tag}>`)) {
      const tagMatcher = new RegExp(`<${tag}>[\\s\\S]*?<\/${tag}>`, 'g')
      const scriptMatcher = new RegExp(`(?:<${tag}>)([\\s\\S]*)(?:<\/${tag}>)`)
      let rendered = markup
      let cyclic = []
      while ((cyclic = tagMatcher.exec(markup)) !== null) {
      // while ((cyclic = scriptMatcher.exec(markup)) !== null) {
        const script = cyclic[0].match(scriptMatcher)[1]
        console.info(`matched bean script:::${script}`)
        const preppedScript = 
        // wrap vm'd script in IIFE to disconnect it from calling globals, thereby
        // significantly improving performance (beyond even that of eval)
        `
        (() => { ${script} } )()
        `
        console.info(`prepped script:::${preppedScript}`)
        const output = vm.runInNewContext(preppedScript, sandbox, sandboxOptions)
        rendered = rendered.replace(cyclic[0], output)          
        console.info(`bean became:::${rendered}`)
      }
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      res.write(rendered)
      done(false)
      // fs.writeFile(`${bnsPath}.html`, rendered, (err) => {
      //   // TODO: use fs.mkdtemp and write this into a temporary directory
      //   // just throw for now
      //   if (err) {
      //     console.error(err)
      //     res.setStatus(500)
      //     return done(false)
      //   }
      //   req.url += '.html'
      //   done()
      // })
    }
  })
}
