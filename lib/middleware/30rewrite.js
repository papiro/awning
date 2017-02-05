'use strict'

const 
  path = require('path'), fs = require('fs')
,
  Log = require('logerr'),
  log = new Log('mrewrite.log', 'mrewrite.err', { namespace: 'mrewrite' })
;

const index = 'index.html'

/***
 * Rewrite requests for a directory to its ${index} file.
***/

module.exports = function rewrite (req, res, done) {
  const resourceFileExtension = path.extname(req.url).slice(1)
  const rewrites = req.rewrite
  for (let rewrite in rewrites) {
    console.log(`rewrite rule:::${rewrite}`)
    console.log(`req url:::${req.url}`)
    if (rewrites.hasOwnProperty(rewrite)) {
      if ((new RegExp(rewrite)).test(req.url)) {
        log.log(`rewrite rule:::${rewrite}`)
        log.log(`req url:::${req.url}`)
        req.url = rewrites[rewrite]
        log.log(`rewriting request url to ${req.url}`)
        break
      }
    }
  }
  // rewrite for index pages beyond this point
  if (!resourceFileExtension) {
    req.url = path.join(req.url, index)
    log.log(`rewriting request url to ${req.url}`)
  }
  done()
}
