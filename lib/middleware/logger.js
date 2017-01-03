'use strict'

const 
  Log = require('logerr')
,
  date = (new Date()).toISOString().split('T')[0]
,
  log = new Log(`../../logs/${date}.log`, `../../logs/${date}.err`)
;

let
  ips = {}
;

module.exports = function logger (req, res, done) {
  const ip = req.connection.remoteAddress

  switch (res.statusCode) {
    case 500:
      log.error(500)
      log.error('url ', req.url)
      log.error('headers ', req.headers)
      log.error('ip ', ip)
      break
    case 404:
      log.warn(404)
      log.warn('url ', req.url)
      log.warn('ip ', ip)
      log.warn('user-agent ', req.headers['user-agent'])
      break
    default: 
      const now = Date.now()
      // if within an hour of last request, don't log this one, unless it's a warning/error
      if (now - ips[ip] < 3600000) {
        ips[ip] = now
        done()
      } else {
        ips[ip] = now
        log.info(new Date())
        log.log('ip ', ip)
        log.log('user-agent ', req.headers['user-agent'])
      }
  }
  done()
}
