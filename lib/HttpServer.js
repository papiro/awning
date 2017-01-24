'use strict'

const 
  http = require('http') 
,
  querystring = require('querystring')
,
  Log = require('logerr'),
  log = new Log('server.log', 'server.err')
;

module.exports = class HttpServer extends http.Server {
  constructor ({ name = '', uid = null, port = 80, middleware = [], api = {} }) {
    super()

    Object.assign(this, {
      name
    })

    this.on('request', (req, res) => {
      const additionalRequestAndResponseProperties = {
        // 'cause it's just too hard to choose which one to add these to
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
        },
        writeJSON (obj) {
          this.write(JSON.stringify(obj))
        }
      })

      const middlewareGenerator = (function* () {
        let totalRuns = 0
        for (let i = 0; i < middleware.length; i++) {
          log.debug(`yielding ${middleware[i].name}::${i}`)
          totalRuns++
          yield middleware[i](req, res, (next = true) => {
            if (--totalRuns) throw new Error(`middleware ${middleware[i].name} contains more than one exit-path`)
            log.debug(`in callback from::${i}`)
            process.nextTick(() => {// need to stagger this to avoid "generator already running" error
              if (!next || middlewareGenerator.next().done) {
                log.debug('res.end()')
                res.end()
              }
            })
          })
        }
      })()
      // init the generator
      middlewareGenerator.next()
    })

    this.listen(port, () => {
      // set ownership of process
      if (uid) {
        try {
          process.setuid(uid)  
        } catch (e) {
          throw new Error(`failed to set user id of process to ${uid} with reason:::${e}`)
        }
      }
    })
  }
}
