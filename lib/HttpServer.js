'use strict'

const 
  http = require('http'), util = require('util')
,
  debug = util.debuglog('awning')
,
  querystring = require('querystring')
,
  getPOSTpayload = require('./utils/getPOSTpayload')
;

http.IncomingMessage.prototype.getPOSTpayload = getPOSTpayload

module.exports = class HttpServer extends http.Server {
  constructor ({ name = '', uid = null, port = 80, rewrite = {}, middleware = [], api = {}, root = '', auth = null }) {
    super()

    Object.assign(this, {
      name
    })

    this.on('request', async (req, res) => {
      const additionalRequestAndResponseProperties = {
        // 'Cause it's just too hard to choose which one to add these to
        api,
        root,
        rewrite
      }

      // Split off URL params
      const [ url, params ] = req.url.split('?')
      // Restore req.url
      req.url = url

      let cookies = req.headers.cookie
      // Split off cookies if cookie header present
      cookies = cookies && cookies.split(';').reduce( (prev, cookie) => {
        const [cookieName, cookieVal] = cookie.trim().split('=')
        prev[cookieName] = cookieVal
        return prev
      }, {})

      Object.assign(req, additionalRequestAndResponseProperties, {
        auth,
        params: querystring.parse(params),
        cookies
      })

      Object.assign(res, additionalRequestAndResponseProperties, {
        setStatus (statusCode) {
          this.statusCode = statusCode
        },
        setHeaders (obj) {
          Object.keys(obj).forEach( key => {
            this.setHeader(key, obj[key])
          })
        },
        writeJSON (obj) {
          this.write(JSON.stringify(obj))
        }
      })

      res.on('error', (...args) => {
        res.setStatus(500)
        debug(...args)
      })

      const middlewareGenerator = (function* () {
        let totalRuns = 0
        for (let i = 0; i < middleware.length; i++) {
          debug(`yielding ${middleware[i].name}::${i}`)
          totalRuns++
          yield middleware[i](req, res, (next = true) => {
            if (--totalRuns) throw new Error(`middleware ${middleware[i].name} contains more than one exit-path`)
            process.nextTick(() => {// need to stagger this to avoid "generator already running" error
              if (!next || middlewareGenerator.next().done) {
                debug('middleware layer terminating')
                middlewareGenerator.return()
                // if headers haven't sent, mark as 404
                // if (!res.headersSent) {
                //   res.setStatus(404)
                // }
                res.end()
              }
            })
          })
        }
      })()
      // Init the generator
      middlewareGenerator.next()
    })

    this.listen(port, () => {
      console.log('HttpServer running on port ', port)
      // Set ownership of process
      if (uid && !~process.platform.indexOf('win')) {
        try {
          process.setuid(uid)  
        } catch (e) {
          throw new Error(`failed to set user id of process to ${uid} with reason:::${e}`)
        }
      }
    })
  }
}
