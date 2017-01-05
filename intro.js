#!/usr/local/bin/node

'use strict'

const 
  fs = require('fs'),
  path = require('path')
,
  logerr = require('logerr')
,
  HttpServer = require('./lib/HttpServer'),
,
  noop = () => {}
;

const middlewareLoader = new Promise( (resolve, reject) => {
  fs.readdir('./lib/middleware', (err, res) => {
    if (err) { reject(err) }
    resolve(res.map( fn => require(`./lib/middleware/${res}`) ))
  }) 
})

const { 
  name, 
  port, 
  root, 
  api,
  onError = noop, 
  onRequest = noop, 
  socketTimeout = 120000
} = require('./config')

middlewareLoader.then( middleware => {
  const server = new HttpServer({ 
    name,
    port, 
    root,
    api,
    middleware
  })
}).catch( err => {
  throw err 
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
