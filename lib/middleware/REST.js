'use strict'

const path = require('path')

module.exports = (req, res, done) => {
  if (~req.restApiEndpoints.indexOf(req.url)) {
    const service = require(path.join(req.mount, req.url, 'index.js'))
    service(req, res, () => {
      done()
    })
  } else {
    done()
  }
}
