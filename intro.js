#!/usr/local/bin/node

'use strict'

const 
  paths = {
    HttpServer: './lib/HttpServer',
    middleware: './lib/middleware',
    log: 'startup.log',
    syslog: 'sys.log',
    socketlog: 'socket.log'
  }
,
  fs = require('fs'), path = require('path'), os = require('os')
,
  config = require(path.resolve(process.cwd(), process.argv[2]))
,
  { logLevel, logsPath } = config,
  Log = require('logerr')({ logLevel, logsPath }),
  log = new Log(paths.log, { namespace: 'startup' }),
  syslog = new Log(paths.syslog, { namespace: 'syslog' }),
  socketlog = new Log(paths.socketlog, { namespace: 'socket' }) 
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

// set logs path
process.env.LOGS_PATH = logsPath

const { 
  name, 
  uid,
  port, 
  api,
  root,
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
  server.on('request', req => {
    onRequest()
    // Socket logging!
    req.connection.on('close', had_error => {
      log.info(`socket closed ${had_error ? 'with' : 'without'} error`)
    }).on('connect', () => {
      log.info('socket connected')
    }).on('data', buffer => {
      log.info('data being written')
    }).on('drain', () => {
      log.info('data drained')
    }).on('end', () => {
      log.info('FIN packet received from "other end"')
    }).on('error', err => {
      log.error(err)
    }).on('timeout', () => {
      log.warn('socket timeout')
    })
  })
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
      if (err) syslog.error(err)
      syslog.log(`${count} connections open`)
      syslog.info(`${os.freemem()}/${os.totalmem()} memory available`)
      syslog.info(`${os.loadavg()}:::<< load average "should be less than number of logical CPUs in the system" (${os.cpus().length})`)
      syslog.info(`${os.uptime()}:::<< system uptime`)
      syslog.info(`${process.uptime()}:::<< process uptime`)
      const cpuUsage = process.cpuUsage()
      syslog.info(`${cpuUsage.user}:::<< user cpu usage`)
      syslog.info(`${cpuUsage.system}:::<< system cpu usage`)
      syslog.info(`${process.memoryUsage()}:::<< process memory usage`)
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
