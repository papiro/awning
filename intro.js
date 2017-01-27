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
  log = new Log(paths.log, { namespace: 'startup' }),
  logsys = new Log(paths.logsys, { namespace: 'syslog' })
,
  HttpServer = require(paths.HttpServer)
,
  noop = () => {}
;

const middlewareLoader = new Promise( (resolve, reject) => {
  fs.readdir(path.resolve(__dirname, paths.middleware), (err, res) => {
    if (err) { reject(err) }
    // filter out dot files (like vim .swp files)
    resolve(res.filter( file => file[0] !== '.' ).map( fn => require(`${paths.middleware}/${fn}`) ))
  }) 
})

// set root
process.env.ROOT = config.root
// set logs path
process.env.LOGS_PATH = logsPath
// set NODE_PATH
process.env.NODE_PATH = path.join(__dirname, 'node_modules')

const { 
  name, 
  uid,
  port, 
  api,
  onError = noop, 
  onRequest = noop, 
  socketTimeout = 120000
} = config

middlewareLoader.then( middleware => {
  log.log('...startup')
  const server = new HttpServer({ 
    name,
    uid,
    port, 
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
   * 5. log the process uptime
   * 6. log the cpu usage
   * 7. log the memory usage
  **/
  setInterval(() => {
    server.getConnections( (err, count) => {
      if (err) logsys.error(err)
      logsys.log(`${count} connections open`)
      logsys.info(`${os.freemem()}/${os.totalmem()} memory available`)
      logsys.info(`${os.loadavg()}:::<< load average "should be less than number of logical CPUs in the system" (${os.cpus().length})`)
      logsys.info(`${os.uptime()}:::<< system uptime`)
      logsys.info(`${process.uptime()}:::<< process uptime`)
      const cpuUsage = process.cpuUsage()
      logsys.info(`${cpuUsage.user}:::<< user cpu usage`)
      logsys.info(`${cpuUsage.system}:::<< system cpu usage`)
      logsys.info(`${process.memoryUsage()}:::<< process memory usage`)
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
})
