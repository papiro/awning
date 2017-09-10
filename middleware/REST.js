'use strict'

const 
  path = require('path')
, 
  util = require('util'),
  debug = util.debuglog('awning.REST')
,
  httpMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE']
,
  { api, root } = app
;
const
  endpoints = Object.keys(api).reduce( (prev1, url) => {
    const methods = api[url]
    prev1[url] = methods.reduce( (prev2, method) => {
      prev2[method.toLowerCase()] = require(path.join(root, url, '.' + method.toLowerCase()))
      return prev2
    }, {})
    return prev1
  }, {})
/*
  {
    '/api/path': {
      'GET': [Function],
      'POST': [Function]
    }
  }
*/
;

module.exports = function REST (req, res, done) {
  const 
    { url, method } = req
  ;
  if (endpoints.hasOwnProperty(url)) {
    try {
      debug(`${url} being hit`)
      const endpoint = endpoints[url]
      // if the service being called doesn't support the method used
      if (!endpoint.hasOwnProperty(method.toLowerCase())) {
        debug(`Method not allowed: ${method}`)
        res.setStatus(405)
        res.setHeader('Allow', Object.keys(endpoint).join(', ')) 
        done(false)        
      } else {
        debug('Heading into client service call...')
        endpoints[url][method.toLowerCase()](req, res, done)        
      }
    } catch (e) {
      res.emit('error', e)
      done(false)
    }
  } else {
    debug('Not an api call.')
    done()
  }
}
