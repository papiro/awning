'use strict'

const path = require('path')
const fs = require('fs')

/***
 * Rewrite requests for a directory to an index file.
 * Loop through req.indexFiles looking for an index file which exists in the directory
 *  and stop at the first one.  If none are found, use the first index file as the req.url
 *  rewrite.
***/

module.exports = function rewrite (req, res, done) {
  if (req.url === null) return done()

  const resourceFileExtension = path.extname(req.url).slice(1)
  // rewrite for index pages beyond this point
  if (resourceFileExtension) { return done() }

  const { indexFiles } = req
  // quick skip when only dealing with 'index.html'
  if (indexFiles.length === 1) {
    req.url = path.join(req.url, indexFiles[0])
    return done()
  }

  fs.readdir(path.join(req.mount, req.url), (err, res) => {
    if (err) {
      console.log(err)
      req.url = path.join(req.url, indexFiles[0])
      return done()
    }

    let i = 0
    for ( ; i < indexFiles.length; i++) {
      if (~res.indexOf(indexFiles[i])) {
        break
      }  
    }
    // reset if we've gone too far
    const indexFile = indexFiles[i > indexFiles.length ? 0 : i] 
    req.url = path.join(req.url, indexFile)
    done()
  })
}
