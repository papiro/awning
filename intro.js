#!/usr/local/bin/node

'use strict'

const 
  paths = {
    HttpServer: './lib/HttpServer',
    middleware: './lib/middleware',
    config: './config',
    log: 'logs/startup.log'    
  }
,
  config = require(paths.config)
,
  fs = require('fs'),
  path = require('path')
,
  Log = require('logerr')(config.logLevel),
  log = new Log(paths.log)
,
  HttpServer = require(paths.HttpServer)
,
  noop = () => {}
;

const middlewareLoader = new Promise( (resolve, reject) => {
  fs.readdir(paths.middleware, (err, res) => {
    if (err) { reject(err) }
    resolve(res.map( fn => require(`${paths.middleware}/${fn}`) ))
  }) 
})

const { 
  name, 
  port, 
  root, 
  api,
  async = false,
  onError = noop, 
  onRequest = noop, 
  socketTimeout = 120000
} = config

middlewareLoader.then( middleware => {
  log.log('...startup')
  const server = new HttpServer({ 
    name,
    port, 
    root,
    api,
    async,
    middleware
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
}).catch( err => {
  log.error(`STARTUP ERROR ${err}`)
  throw err 
})
