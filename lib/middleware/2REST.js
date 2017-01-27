'use strict'

const 
  path = require('path')
,
  Log = require('logerr'),
  log = new Log('api.log', 'api.err', { namespace: 'api' })
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
    log.info(`api endpoint ${url} hit`)
    const service = require(path.join(process.env.ROOT, url, index))
    try {
      service(req, res, () => {
        done(false)
      })
    } catch (e) {
      log.error(e)
      res.setStatus(500)
      done(false)
    }
  } else {
    done()
  }
}
