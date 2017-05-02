'use strict'

const 
  path = require('path'), fs = require('fs'), util = require('util')
,
  debug = util.debuglog('awning.rewrite')
,
  index = 'index.html'
;
/***
 * Rewrite requests for a directory to its ${index} file.
***/

module.exports = function rewrite (req, res, done) {
  const resourceFileExtension = path.extname(req.url).slice(1)
  const rewrites = req.rewrite
  for (let rewrite in rewrites) {
    debug(`rewrite rule:::${rewrite}`)
    debug(`req url:::${req.url}`)
    if (rewrites.hasOwnProperty(rewrite)) {
      if ((new RegExp(rewrite)).test(req.url)) {
        debug(`rewrite rule:::${rewrite}`)
        debug(`req url:::${req.url}`)
        req.url = rewrites[rewrite]
        debug(`rewriting request url to ${req.url}`)
        break
      }
    }
  }
  // rewrite for index pages beyond this point
  if (!resourceFileExtension) {
    req.url = path.join(req.url, index)
    debug(`rewriting request url to ${req.url}`)
  }
  done()
}
