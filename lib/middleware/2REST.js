'use strict'

const 
  path = require('path')
,
  Log = require('logerr'),
  log = new Log('api.log', 'api.err')
,
  httpMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE']
;

module.exports = function REST (req, res, done) {
  const { url, api } = req
  if (~api.hasOwnProperty(url)) {
    // if the service being called doesn't support the method used
    if (!~api[url].indexOf(req.method)) {
      res.setStatus(405)
      res.setHeader('Allow', api[url].join(', ')) 
      return done(false)
    }
    log.log(`api endpoint ${url} hit`)
    const service = require(path.join(req.mount, url, 'index.js'))
    try {
      service(req, res, () => {
        done(false)
      })
    } catch (synchronous_error) {
      log.error(synchronous_error)
      done(false)
    }
  } else {
    done()
  }
}
