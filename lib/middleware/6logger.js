'use strict'

const 
  path = require('path')
,
  Log = require('logerr')
,
  date = (new Date()).toISOString().split('T')[0]
,
  log_request = new Log(`logs/${date}.log`, `logs/${date}.err`)
;

let
  ips = {}
;

module.exports = function logger (req, res, done) {
  const ip = req.connection.remoteAddress

  switch (res.statusCode) {
    case 500:
      log_request.error(500)
      log_request.error('url ', req.url)
      log_request.error('headers ', req.headers)
      log_request.error('ip ', ip)
      break
    case 404:
      log_request.warn(404)
      log_request.warn('url ', req.url)
      log_request.warn('ip ', ip)
      log_request.warn('user-agent ', req.headers['user-agent'])
      break
    default: 
      const now = Date.now()
      // if within an hour of last request, don't log this one, unless it's a warning/error
      if (now - ips[ip] < 3600000) {
        ips[ip] = now
        done()
      } else {
        ips[ip] = now
        log_request.info(new Date())
        log_request.log('ip ', ip)
        log_request.log('user-agent ', req.headers['user-agent'])
      }
  }
  done()
}
