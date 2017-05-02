'use strict'

/***
  *   debuglog namespaces: awning, awning.REST, awning.rewrite, awning.static
***/

module.exports = (config = {}) => {
  const 
    paths = {
      HttpServer: './lib/HttpServer',
      middleware: './lib/middleware'
    }
  ,
    fs = require('fs'), path = require('path'), os = require('os'), util = require('util')
  ,
    debug = util.debuglog('awning')
  ,
    HttpServer = require(paths.HttpServer)
  ,
    noop = () => {}
  ;

  const { 
    name, 
    uid,
    port, 
    api,
    root,
    rewrite,
    onError = noop, 
    onRequest = noop, 
    socketTimeout = 120000,
    middleware
  } = config

  debug('...startup')
  const server = new HttpServer({ 
    name,
    uid,
    port, 
    api,
    root,
    rewrite,
    middleware
  })
  server.timeout = socketTimeout
  server.on('error', onError)
  server.on('request', (req, res) => {
    onRequest(req, res)
    // Socket logging!
    req.connection.on('close', had_error => {
      debug(`socket closed ${had_error ? 'with' : 'without'} error`)
    }).on('connect', () => {
      debug('socket connected')
    }).on('data', buffer => {
      debug('data being written')
    }).on('drain', () => {
      debug('data drained')
    }).on('end', () => {
      debug('FIN packet received from "other end"')
    }).on('error', err => {
      debug(err)
    }).on('timeout', () => {
      debug('socket timeout')
    })
  })
  
  // handle Ctrl+c
  process.on(os.constants.signals.SIGINT, () => {
    server.close(() => {
      console.log(`${server.name || 'server'} shut-down gracefully - `)           
      process.exit(1)
    })
  })

  return server
}
