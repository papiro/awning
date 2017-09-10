'use strict'

module.exports = function caching (req, res, done) {
  if (! res.headersSent) {
    // caching disabled for development
    res.setHeader('expires', Date())
  }
  done()
}
