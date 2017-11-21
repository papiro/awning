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

  const bnsPath = path.join(app.root, req.url)
  debug(`begin rendering beans file:::${bnsPath}`)
  fs.readFile(bnsPath, { encoding: 'utf8' }, (err, markup) => {
    if (err) {
      debug(err)
      if (err.code === 'ENOENT') {
        res.setStatus(404)
      } else {
        res.emit('error', err)
      }
      return done(false)
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    })

    const pieces = beansUtil.getPieces({ markup })
    const beanPromises = pieces.map( beanData => {
      let output, tplConf
      // If what we have is a function to generate markup...
      // ...and we have the template data, go ahead and render right here.
      if (beanData.fn 
          && app.bnsConfig 
          && (tplConf = app.bnsConfig[beanData.id])
          && tplConf.data) {
        const fn = eval(beanData.fn)
        debug(`Rendering template:::${beanData.id}:::using fn:::${fn}:::with data args:::${beanData.args}`)
        return tplConf.data(beanData.args).then( data => {
          debug(`And with data:::`)
          debug(data)
          return fn(data)
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

    Promise.all(beanPromises).then( markup => {
      const output = markup.map(piece => piece.trim()).join('')
      debug(`Writing:::${output}`)
      res.write(output)
      return done(false)
    }).catch( err => {
      res.emit('error', err)
    })
  })
}
