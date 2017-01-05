'use strict'

const
    //url         = require('url'),
	  fs          = require('fs'),
	  path        = require('path')
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

module.exports = function fileServer (req, res, done) {
  if (req.url === null) return done()

  const
//    referer = req.headers.referer || '',
//    refererPathname = url.parse(referer).pathname || ''
//  ,
    resourceFileExtension = path.extname(req.url).slice(1),
    resourcePath = path.join(res.mount/*, refererPathname*/, req.url),
    fStream = fs.createReadStream(resourcePath)
  ;

  fStream.on('error', err => {
    switch (err.code) {
      case 'ENOENT':
        notFound(res)
        break
      default:
        serverError(res, err)
    }
    done()
  })

  fStream.on('end', done)

  success(res, fStream)
}
