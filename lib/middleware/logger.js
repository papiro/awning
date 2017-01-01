'use strict'

const Log = require('logerr')
const log = new Log('../../logs/request.log', '../../logs/request.err')

module.exports = function logger (req, res, done) {
  const ip = req.connection.remoteAddress
  log.info(new Date())
  log.log('ip ', ip)
  log.log('user-agent ', req.headers['user-agent'])

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
  }
  done()
}
