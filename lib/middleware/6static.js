'use strict'

const
    //url         = require('url'),
	  fs          = require('fs'),
	  path        = require('path')
,
    Log = require('logerr'),
    log = new Log('static.log', 'static.err', { namespace: 'static' })
,
    reset = (res, Location) => {
      res.writeHead(302, {
        Location: '/'
      })
      res.end()
    }
,
    notFound = (res) => {
      res.setStatus(404)
    }
,
    serverError = (res, error) => {
      res.setStatus(500)
      res.emit('500', error)
      //res.end()
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
    resourcePath = path.join(process.env.ROOT/*, refererPathname*/, req.url),
    fStream = fs.createReadStream(resourcePath)
  ;

  let closed = false
  
  fStream.on('error', err => {
    log.error(`error piping ${resourcePath} to response:::${err}`)
    switch (err.code) {
      case 'ENOENT':
        notFound(res)
        break
      default:
        serverError(res, err)
    }
    done()
  }).on('end', () => {
    log.log(`${resourcePath} pipe end event`)
    if (!closed) done()
    closed = true
  }).on('close', () => {
    log.log(`${resourcePath} pipe close event`)
    if (!closed) done()
    closed = true
  })

  log.log(`begin piping ${resourcePath} to response`)
  success(res, fStream)
}
