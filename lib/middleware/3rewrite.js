'use strict'

const 
  path = require('path')
,
  fs = require('fs')
;

const index = 'index.html'

/***
 * Rewrite requests for a directory to its ${index} file.
***/

module.exports = function rewrite (req, res, done) {
  const resourceFileExtension = path.extname(req.url).slice(1)
  // rewrite for index pages beyond this point
  if (!resourceFileExtension) {
    req.url = path.join(req.url, index)
  }
  done()
}
