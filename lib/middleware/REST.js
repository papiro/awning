'use strict'

const 
  path = require('path'), util = require('util')
,
  debug = util.debuglog('awning.REST')
,
  httpMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE']
,
  index = '.index.js'
;

module.exports = function REST (req, res, done) {
  const { url, api } = req
  if (api.hasOwnProperty(url)) {
    // if the service being called doesn't support the method used
    if (!~api[url].indexOf(req.method)) {
      res.setStatus(405)
      res.setHeader('Allow', api[url].join(', ')) 
      return done(false)
    }
    debug(`api endpoint ${url} hit`)
    const service = require(path.join(req.root, url, index))
    try {
      service(req, res, () => {
        done(false)
      })
    } catch (e) {
      res.emit('error')
      done(false)
    }
  } else {
    done()
  }
}
