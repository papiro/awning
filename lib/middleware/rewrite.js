'use strict'

const 
  path = require('path'), fs = require('fs'), util = require('util')
,
  debug = util.debuglog('awning.rewrite')
,
  index = 'index.html'
;

module.exports = function rewrite (req, res, done) {
  const rewrites = req.rewrite

  for (let i = 0; i < rewrites.length; i++) {
    const rewrite = rewrites[i]
    // Stop the loop at the first match we find
    if (rewrite.regex.test(req.url)) {
      debug(`rewrite rule:::${rewrite.regex}`)
      if (rewrite.to) {
        debug(`rewriting ${req.url} to ${rewrite.to}`)
        req.url = rewrite.to
        // Don't return here - Let the index page rewrite happen
      } else 
      if (rewrite.status) {
        debug(`setting status: ${rewrite.status}, and sending headers: `, rewrite.headers)
        res.setStatus(rewrite.status)
        res.setHeaders(rewrite.headers)
        return done(false)        
      }
      else {
        throw new TypeError(`rewrite parameters are of type ${typeof params}`)
      }
    }
  }

  const resourceFileExtension = path.extname(req.url).slice(1)
  // rewrite for index pages beyond this point
  if (!resourceFileExtension) {
    req.url = path.join(req.url, index)
    debug(`rewriting request url to ${req.url}`)
  }
  done()
}
