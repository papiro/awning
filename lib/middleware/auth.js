'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.auth')
,
  authController = require('./utils/AuthController')
,
  path = require('path'),
  indexFile = '.index.js'
,
  noop = () => {}
;

let 
  authFn = (req, res, done) => { done () }
,
  basicFn = noop,
  otpFn = noop,
  customFn = noop
;

const { auth } = app
// If auth config is defined, flesh out the middleware
if (auth) {
  const { basic, otp, custom } = auth
  if (!basic && !otp && !custom) throw new ReferenceError('No valid strategy defined on the config auth object.  Valid strategies are "basic", "otp", or "custom".')
  
  const { protectedResources } = auth
  if (!protectedResources) throw new ReferenceError('No protected resources found in the config auth object.  No point in having auth without having resources which need protection.')
  
  debug('Protected resources:::', protectedResources)
  if (basic) {
    basicFn = ({ url }, res) => {
      return new Promise( (resolve, reject) => {
        resolve()        
      })
      // authController
      //   .once('user.create.success', () => {
      //     debug('SUCCESSFUL:::user.create')
      //     done()
      //   })
      //   .once('user.create.fail', err => {
      //     debug('ERROR:::user.create')
      //     throw err
      //   })

      // switch (url) {
      //   case gateway.create:
      //     authController.userCreate(payload.username, payload.password)      
      //     break
      //   case gateway.login:
      //     authController.userLogin(payload.username, payload.password)
      //     break
      //   default:
      //     return done()
      //   break
      // }
    }
  }

  if (otp) {
    otpFn = ({ url }, res) => {
      return new Promise( (resolve, reject) => {
        resolve()        
      })
      // switch (url) {
      //   case otp.send:
      //     authController.sendOtpCode(payload.username, payload.password)      
      //     break
      //   case otp.login:
      //     authController.otpLogin(payload.username, payload.password)
      //     break
      //   default:
      //     return done()
      //   break
      // }      
    }
  }

  if (custom) {
    const 
      { endpoints } = custom,
      modulesObj = endpoints.reduce( (prev, endpoint) => {
        prev[endpoint] = require(path.join(app.root, endpoint, indexFile))
        return prev
      }, {})
    ;

    customFn = (req, res) => {
      return new Promise( (resolve, reject) => {
        // Short-circuit if url is not auth
        if (!~endpoints.indexOf(req.url)) resolve()

        let customModule = modulesObj[req.url]
        customModule(req, res, resolve, authController).catch( err => {
          res.emit('error', err)
        })    
      })
    }
  }

  authFn = (req, res, done) => {
    const { url, payload } = req
    
    if (~protectedResources.indexOf(url)) {
      debug(`${url} is a protected resource.`)
      if (!authController.isValidSession(req)) {
        debug('Not a valid session.')
        res.setStatus(401)
        return done(false)
      } else {
        debug('Valid session detected.')
      }
    } else {
      debug(`${url} is not a protected resource.`)
    }

    // When executed, these functions will return promises
    Promise.all([basicFn, otpFn, customFn].map( fn => fn(req, res)))
      .then( results => {
        done()
      }).catch( err => {
        console.error(err)
      })
  }
}

module.exports = authFn
