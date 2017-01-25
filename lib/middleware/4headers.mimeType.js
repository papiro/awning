'use strict'

const
	  path      = require('path')
,
    mimeTypes = {
      'html'  : 'text/html',
      'jsml'  : 'text/html',
      'css'   : 'text/css',
      'jpeg'  : 'image/jpeg',
      'jpg'   : 'image/jpeg',
      'png'   : 'image/png',
      'ico'   : 'image/vnd.microsoft.icon',
      'svg'   : 'image/svg+xml',
      'mp3'   : 'audio/mpeg',
      'mpeg'  : 'video/mpeg',
      'js'    : 'application/javascript',
      'json'  : 'application/json',
      'map'   : 'application/json'
    }
;

module.exports = function mimeType (req, res, done) {
  if (req.url === null) return done()

  const
    resourceFileExtension = path.extname(req.url).slice(1),
    mimeType = mimeTypes[resourceFileExtension.toLowerCase()]
  ;

  if (!mimeType) throw new ReferenceError(`mime-type missing for ${resourceFileExtension.toLowerCase()}`)

  res.setHeader('Content-Type', mimeType)
  done()
}
