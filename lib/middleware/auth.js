'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.auth')
,
  authController = require('./utils/AuthController')
,
  path = require('path'),
  customAuthModuleExtension = '.index.js'
;

module.exports = function auth (req, res, done) {
  // If no auth config is defined, pass to next middleware
  if (!req.auth) return done()

  const 
    { auth, url, payload } = req,
    { basic, otp, custom } = auth
  ;

  if (!basic && !otp && !custom) throw new ReferenceError('No valid strategy defined on the config auth object.  Valid strategies are "basic", "otp", or "custom".')

  if (otp) {
    switch (url) {
      case otp.send:
        authController.sendOtpCode(payload.username, payload.password)      
        break
      case otp.login:
        authController.otpLogin(payload.username, payload.password)
        break
      default:
        return done()
      break
    }    
  }

  if (basic) {
    authController
      .once('user.create.success', () => {
        debug('SUCCESSFUL:::user.create')
        done()
      })
      .once('user.create.fail', err => {
        debug('ERROR:::user.create')
        throw err
      })

    switch (url) {
      case gateway.create:
        authController.userCreate(payload.username, payload.password)      
        break
      case gateway.login:
        authController.userLogin(payload.username, payload.password)
        break
      default:
        return done()
      break
    }    
  }

  if (custom) {
    const endpoint = custom.endpoints[custom.endpoints.indexOf(url)]
    // Short-circuit if not authenticating
    if (!endpoint) return done()

    const customModule = require(path.join(req.root, endpoint, customAuthModuleExtension))
    customModule(req, res, done, authController)
  }
}
