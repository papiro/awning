'use strict'

const
    //url         = require('url'),
	  fs          = require('fs'),
	  path        = require('path')
,
    Log = require('logerr'),
    log = new Log('static.log', 'static.err', { namespace: 'static' })
,
    serverError = (res, error) => {
      res.setStatus(500)
      res.emit('500', error)
    }
,
    success = (res, content) => {
      res.setStatus(200)
      content.pipe(res)
    }
;

module.exports = function staticFileServer (req, res, done) {
  const
//    referer = req.headers.referer || '',
//    refererPathname = url.parse(referer).pathname || ''
//  ,
    resourceFileExtension = path.extname(req.url).slice(1),
    resourcePath = path.join(req.root/*, refererPathname*/, req.url),
    fStream = fs.createReadStream(resourcePath)
  ;

  let closed = false

  function logAndClose (evtType) {
    log.log(`${resourcePath} pipe ${evtType} event`)
    if (!closed) done(false)
    closed = true
  }
  
  fStream.on('error', err => {
    switch (err.code) {
      case 'ENOENT':
        log.log(`no file found for ${resourcePath}`)
        done()
        break
      default:
        log.error(`error piping ${resourcePath} to response:::${err}`)
        serverError(res, err)
        done(false)
        break
    }
  }).on('end', () => {
    logAndClose('end')
  }).on('close', () => {
    logAndClose('close')
  })

  log.log(`begin piping ${resourcePath} to response`)
  success(res, fStream)
}
