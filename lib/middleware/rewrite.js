'use strict'

const 
  path = require('path'), fs = require('fs'), util = require('util')
,
  debug = util.debuglog('awning.rewrite')
,
  index = 'index.html'
;

module.exports = function rewrite (req, res, done) {
  const rewrites = req.rewrite

  // flag because we can't break the flow from within a switch-case
  let next = true

  Object.keys(rewrites).forEach( rewrite => {
    if ((new RegExp(rewrite)).test(req.url)) {
      const params = rewrites[rewrite]
      debug(`rewrite rule:::${rewrite}`)
      switch (typeof params) {
        case 'string':
          debug(`rewriting ${req.url} to ${params}`)
          req.url = params
          break

        case 'object':
          debug(`setting status: ${params.status}, and sending headers: `, params.headers)
          res.setStatus(params.status)
          res.setHeaders(params.headers)
          done(false)
          next = false
          break

        default:
          throw new TypeError(`rewrite parameters are of type ${typeof params}`)
          break
      }
    }
  })

  const resourceFileExtension = path.extname(req.url).slice(1)
  // rewrite for index pages beyond this point
  if (!resourceFileExtension) {
    req.url = path.join(req.url, index)
    debug(`rewriting request url to ${req.url}`)
  }
  next && done()
}
