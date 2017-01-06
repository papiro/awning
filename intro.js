#!/usr/local/bin/node

'use strict'

const 
  paths = {
    HttpServer: './lib/HttpServer',
    middleware: './lib/middleware',
    config: './config',
    log: 'startup.log',
    logsys: 'sys.log'
  }
,
  config = require(paths.config)
,
  fs = require('fs'),
  path = require('path'),
  os = require('os')
,
  { logLevel, logsPath } = config,
  Log = require('logerr')({ logLevel, logsPath }),
  log = new Log(paths.log),
  logsys = new Log(paths.logsys)
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
    middleware
  })
  server.timeout = socketTimeout
  server.on('error', onError)
  server.on('request', onRequest)
  /** Every hour: 
   * 1. log the number of current connections
   * 2. log the freemem/totalmem
   * 3. log the system activity via the load average calculation
   * 4. log the system uptime
  **/
  setInterval(() => {
    server.getConnections( (err, count) => {
      if (err) log.error(err)
      logsys.log(`${count} connections open`)
      logsys.info(`${os.freemem()}/${os.totalmem()} memory available`)
      logsys.info(`${os.loadavg()}:::<< load average "should be less than number of logical CPUs in the system" (${os.cpus().length})`)
      logsys.info(`${os.uptime()}:::<< system uptime`)
    }) 
  }, 3600000)
  // handle Ctrl+c
  process.on(os.constants.signals.SIGINT, () => {
    server.close(() => {
      console.log(`${server.name || 'server'} shut-down gracefully - `)           
      process.exit(1)
    })
  })
}).catch( err => {
  log.error(`STARTUP ERROR ${err}`)
  throw err 
})
