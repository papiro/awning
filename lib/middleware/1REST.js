'use strict'

const 
  path = require('path')
,
  Log = require('logerr'),
  log = new Log('logs/api.log', 'logs/api.err')
;

module.exports = function REST (req, res, done) {
  if (~req.api.indexOf(req.url)) {
    log.log(`api endpoint ${req.url} hit`)
    const service = require(path.join(req.mount, req.url, 'index.js'))
    try {
      service(req, res, () => {
        done()
      })
    } catch (synchronous_error) {
      log.error(synchronous_error)
      done()
    }
  } else {
    done()
  }
}
