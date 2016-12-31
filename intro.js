'use strict'

const 
  config = require('./config'),
  HttpServer = require('./web_server/index'),
  reverseProxyWebServer = require('./reverse_proxy/frontierman')(config), 
  path = require('path')
,
  noop = () => {}
,
  onError = (err) => {
    console.log(err)
  }
;

const
  /*** DEFINED MIDDLEWARE ***/
  mwNoop = require('./middleware/noop'),
  mwRewrite = require('./middleware/rewrite'),
  mwMimeType = require('./middleware/mimeType'),
  mwCaching = require('./middleware/caching'),
  mwRender = require('./middleware/render'),
  mwServeFile = require('./middleware/fileServer'),
  mwLogger = require('./middleware/logger'),
  mwREST = require('./middleware/REST'),
  /*** DEFAULT MIDDLEWARE ***/
  defaultMiddleware = [mwREST, mwRewrite, mwMimeType, mwCaching, mwRender, mwServeFile, mwLogger]
;

const httpServers = config.sites
  .map( site => {
    const { host, port, mount, middleware = defaultMiddleware, onError=noop, onRequest=noop, indexFiles = ['index.html'], restApiEndpoints = [] } = site
    const server = new HttpServer({ 
      name: host,
      port, 
      mount: path.join(config.root, mount),
      middleware,
      indexFiles,
      restApiEndpoints
    })
    server.on('error', onError)
    server.on('request', onRequest)
    return server
  })

// handle Ctrl+c
process.on('SIGINT', () => {
  console.log(/*newline*/)
  httpServers.forEach( server => {
    server.close(() => {
      console.log(`${server.name || 'server'} shut-down gracefully - `)           
    })
  })
  reverseProxyWebServer.close(() => {
    console.log(`reverse-proxy-server shut-down gracefully - `)           
  })
  process.nextTick(() => {
    process.exit(1)
  })
})
