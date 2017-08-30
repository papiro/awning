'use strict'

const 
  path = require('path'), 
  fs = require('fs')
,
  util = require('util'),
  debug = util.debuglog('awning.beans')
,
  beansUtil = require('./utils/beans-core')
,
  { bnsConfig } = app
;

module.exports = function beans (req, res, done) {
  if (path.extname(req.url) !== '.bns') return done()

  //now onto business
  const bnsPath = path.join(app.root, req.url)
  debug(`begin rendering beans file:::${bnsPath}`)
  fs.readFile(bnsPath, { encoding: 'utf8' }, (err, markup) => {
    if (err) {
      debug(err)
      res.emit('error', err)
      return done(false)
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    })

    const pieces = beansUtil.getPieces({ markup })
    const beanPromises = pieces.map( beanData => {
      let output, tplConf
      // If what we have is a function to generate markup...
      // If we have the data, go ahead and render right here.
      if (beanData.fn && app.bnsConfig && (tplConf = app.bnsConfig[beanData.id])) {
          const fn = eval(beanData.fn)
          return new Promise( (resolve, reject) => {
            tplConf.getData().then( data => {
              resolve(fn(data))
            })
          })
      } else if (beanData.fn) {
        // Otherwise, make the bean function available via window.awning.beans in the browser.
        return Promise.resolve(
          `
          <script id="precompiledBeans">
            window.awning = window.awning || {};
            awning.beans = awning.beans || {};
            awning.beans.${beanData.id} = ${beanData.fn};
          </script>
          `
        )
      } else {
        return Promise.resolve(beanData.markup)
      }
    })

    Promise.all(beanPromises).then( (...args) => {
      const output = args.join('')
      debug(`Writing:::${output}`)
      res.write(output)
      // Write to file instead of writing the response and let static handle it?
      return done(false)
    })
  })
}

// const path = require('path'), fs = require('fs'), vm = require('vm'), util = require('util')
// ,
//   debug = util.debuglog('awning.beans')
// ,
//   tag = 'bean'

// let
//   sandbox = { path, fs, console, env: process.env },
//   sandboxOptions = { displayErrors: true }
// ;

// module.exports = function beans (req, res, done) {
//   if (path.extname(req.url) !== '.bns') return done()

//   // now onto business
//   const bnsPath = path.join(res.root, path.dirname(req.url), path.basename(req.url).replace('html', 'bns'))
//   debug(`begin rendering beans file:::${bnsPath}`)
//   fs.readFile(bnsPath, { encoding: 'utf8' }, (err, markup) => {
//     if (err) {
//       debug(err)
//       res.setStatus(500)
//       return done(false)
//     }

//     // give the client code a reference to its own location
//     sandbox.root = res.root
    
//     if (~markup.indexOf(`<${tag}>`)) {
//       const tagMatcher = new RegExp(`<${tag}>[\\s\\S]*?<\/${tag}>`, 'g')
//       const scriptMatcher = new RegExp(`(?:<${tag}>)([\\s\\S]*)(?:<\/${tag}>)`)
//       let rendered = markup
//       let cyclic = []
//       while ((cyclic = tagMatcher.exec(markup)) !== null) {
//       // while ((cyclic = scriptMatcher.exec(markup)) !== null) {
//         const script = cyclic[0].match(scriptMatcher)[1]
//         debug(`matched bean script:::${script}`)
//         const preppedScript = 
//         // wrap vm'd script in IIFE to disconnect it from calling globals, thereby
//         // significantly improving performance (beyond even that of eval)
//         `
//         (() => { ${script} } )()
//         `
//         debug(`prepped script:::${preppedScript}`)
//         const output = vm.runInNewContext(preppedScript, sandbox, sandboxOptions)
//         rendered = rendered.replace(cyclic[0], output)          
//         debug(`bean became:::${rendered}`)
//       }
//       res.writeHead(200, {
//         'Content-Type': 'text/html'
//       })
//       res.write(rendered)
//       done(false)
//     } else {
//       done()
//     }
//   })
// }
