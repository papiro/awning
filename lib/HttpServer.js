'use strict'

const 
  http = require('http') 
,
  querystring = require('querystring')
,
  path = require('path')
,
  Log = require('logerr'),
  log = new Log(path.resolve('logs/server.log'), path.resolve('logs/server.err'))
;

module.exports = class HttpServer extends http.Server {
  constructor ({ name = '', port = 8080, root = '/', middleware = [], api = [] }) {
    super()

    Object.assign(this, {
      name
    })

    this.on('request', (req, res) => {
      const additionalRequestAndResponseProperties = {
        // 'cause it's just too hard to choose which one to add these to
        root,
        api
      }

      // split off the params
      const [ url, params ] = req.url.split('?')
      // restore req.url
      req.url = url

      Object.assign(req, additionalRequestAndResponseProperties, {
        params: querystring.parse(params)  
      })

      Object.assign(res, additionalRequestAndResponseProperties, {
        setStatus (statusCode) {
          this.statusCode = statusCode
        }
      })

      log.info('middleware running')
      const middlewareGenerator = (function* () {
        for (let i = 0; i < middleware.length; i++) {
          yield middleware[i](req, res, () => {
            process.nextTick(() => {// need to stagger this to avoid "generator already running" error
              if (middlewareGenerator.next().done) {
                res.end()
              }
            })
          })
        }
      })()
      // init the generator
      middlewareGenerator.next()
    })

    this.listen(port)
  }
}
