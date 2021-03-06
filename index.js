'use strict'

/***
  *   debuglog namespaces: awning, awning.REST, awning.rewrite, awning.static
***/
exports.dev = require('./lib/dev')
exports.build = require('./lib/build')
exports.utils = require('./lib/utils')
exports.Store = require('./lib/store')

exports.server = (config = {}) => {
  const 
    paths = {
      HttpServer: './lib/server',
      middleware: './middleware'
    }
  ,
    fs = require('fs'), path = require('path'), util = require('util')
  ,
    debug = util.debuglog('awning'),
    debug_socket = util.debuglog('awning.socket')
  ,
    HttpServer = require(paths.HttpServer)
  ,
    noop = () => {}
  ;

  const { 
    // Stuff we need for middleware.
    root,
    api,
    auth,
    globals,
    bnsConfig
  } = config

  Object.assign(global.app = {}, {}, {
    root,
    api,
    auth,
    bnsConfig
  }, globals)

  const {
    name, 
    uid,
    port,
    rewrite,
    onError = noop, 
    onRequest = noop, 
    socketTimeout = 120000,
    middleware = [
      'logger',
      'auth',
      'REST', 
      'rewrite', 
      'beans'
    ]
  } = config

  debug('...startup')

  const server = new HttpServer({ 
    name,
    uid,
    port,
    api,
    rewrite,
    middleware: middleware.map( middleware => require(`${paths.middleware}/${middleware}`))
  })

  server.timeout = socketTimeout
  server.on('error', onError)
  server.on('request', (req, res) => {
    onRequest(req, res)
    // Socket logging!
    req.connection.on('close', had_error => {
      debug_socket(`socket closed ${had_error ? 'with' : 'without'} error`)
    }).on('connect', () => {
      debug_socket('socket connected')
    }).on('data', buffer => {
      debug_socket('data being written')
    }).on('drain', () => {
      debug_socket('data drained')
    }).on('end', () => {
      debug_socket('FIN packet received from "other end"')
    }).on('error', err => {
      debug_socket(err)
    }).on('timeout', () => {
      debug_socket('socket timeout')
    })
  })
  
  // handle Ctrl+c
  process.on('SIGINT', () => {
    server.close(() => {
      console.log(`${server.name || 'server'} shut-down gracefully - `)           
      process.exit(1)
    })
  })

  return server
}
