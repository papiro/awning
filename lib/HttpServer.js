'use strict'

const 
  http = require('http') 
,
  querystring = require('querystring')
;

module.exports = class HttpServer extends http.Server {
  constructor ({ name, port=8080, mount, middleware, indexFiles, restApiEndpoints }) {
    super()

    Object.assign(this, {
      name
    })

    this.on('request', (req, res) => {
      const additionalRequestAndResponseProperties = {
        // 'cause it's just too hard to choose which one to add these to
        mount,
        indexFiles,
        restApiEndpoints
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

      const middlewareGenerator = (function* () {
        for (let i = 0; i < middleware.length; i++) {
          yield middleware[i](req, res, () => {
            // need to stagger this to avoid "generator already running" error
            process.nextTick(() => {
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
