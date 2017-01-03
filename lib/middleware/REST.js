'use strict'

const 
  path = require('path')
,
  logerr = require('logerr')
;

module.exports = (req, res, done) => {
  if (~req.restApiEndpoints.indexOf(req.url)) {
    logerr.log(`api endpoint ${req.url} hit`)
    const service = require(path.join(req.mount, req.url, 'index.js'))
    service(req, res, () => {
      done()
    })
  } else {
    done()
  }
}
