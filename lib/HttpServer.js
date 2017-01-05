'use strict'

const 
  http = require('http') 
,
  querystring = require('querystring')
;

const noop = () => {}
const middleware_plain = (middleware, req, res) => {
  for (let i = 0; i < middleware.length; i++) {
    fn(req, res, next => {
      if (!next) i = middleware.length
    })
  }
  res.end()
}
const middleware_async = (middleware, req, res) => {
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
}

module.exports = class HttpServer extends http.Server {
  constructor ({ name = '', port = 8080, root = '/', { async = false, middleware = [] } = middleware, api = [] }) {
    super()

    middlewareEngine = async ? middleware_async : middleware_plain

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

    })

    this.listen(port)
  }
}
