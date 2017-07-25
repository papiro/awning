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
    const 
      servicePath = path.join(req.root, url, index),
      service = require(servicePath)
    ;
    debug(`${servicePath} being hit`)
    try {
      service(req, res, () => {
        done(false)
      })
    } catch (e) {
      res.emit('error', e)
      done(false)
    }
  } else {
    debug('Not an api call.')
    done()
  }
}
