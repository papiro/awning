'use strict'

const 
  config = require('./config'),
  HttpServer = require('./lib/HttpServer'),
  path = require('path')
,
  noop = () => {}
,
  /*** DEFINED MIDDLEWARE ***/
  mwNoop = require('./lib/middleware/noop'),
  mwRewrite = require('./lib/middleware/rewrite'),
  mwMimeType = require('./lib/middleware/mimeType'),
  mwCaching = require('./lib/middleware/caching'),
  mwRender = require('./lib/middleware/render'),
  mwServeFile = require('./lib/middleware/fileServer'),
  mwLogger = require('./lib/middleware/logger'),
  mwREST = require('./lib/middleware/REST'),
  /*** DEFAULT MIDDLEWARE ***/
  defaultMiddleware = [mwREST, mwRewrite, mwMimeType, mwCaching, mwRender, mwServeFile, mwLogger]
;

const { 
  name, 
  port, 
  mount, 
  middleware = defaultMiddleware, 
  onError = noop, 
  onRequest = noop, 
  indexFiles = ['index.html'], 
  restApiEndpoints = [],
  socketTimeout = 120000
} = config

const server = new HttpServer({ 
  name,
  port, 
  mount: path.join(mount),
  middleware,
  indexFiles,
  restApiEndpoints
})

server.timeout = socketTimeout

server.on('error', onError)
server.on('request', onRequest)

// handle Ctrl+c
process.on('SIGINT', () => {
  server.close(() => {
    console.log(`${server.name || 'server'} shut-down gracefully - `)           
    process.exit(1)
  })
})
