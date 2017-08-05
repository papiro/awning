'use strict'

const
  fs = require('fs'),
  path = require('path'),
  util = require('util')
,
  debug = util.debuglog('awning.static')
,
  fileNotFound = (res, resourcePath) => {
    res.setStatus(404)
    res.emit('404', resourcePath)
  },
  serverError = (res, error) => {
    res.setStatus(500)
    res.emit('500', error)
  },
  success = (res, content) => {
    res.setStatus(200)
    content.pipe(res)
  }
;

module.exports = function staticFileServer(req, res, done) {
  const
    resourceFileExtension = path.extname(req.url).slice(1),
    resourcePath = path.join(app.root /*, refererPathname*/ , req.url),
    fStream = fs.createReadStream(resourcePath)
  ;

  let closed = false

  function logAndClose(evtType) {
    debug(`${resourcePath} pipe ${evtType} event`)
    if (!closed) done(false)
    closed = true
  }

  fStream.on('error', err => {
    switch (err.code) {
      case 'ENOENT':
        debug(`no file found for ${resourcePath}`)
        fileNotFound(res, resourcePath)
        done()
        break
      default:
        debug(`error piping ${resourcePath} to response:::${err}`)
        serverError(res, err)
        done(false)
        break
    }
  }).on('end', () => {
    logAndClose('end')
  }).on('close', () => {
    logAndClose('close')
  })

  debug(`begin piping ${resourcePath} to response`)
  success(res, fStream)
}
