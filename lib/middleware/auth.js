'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.auth')
,
  authController = new (require('./utils/AuthController'))()
;

module.exports = function auth ({ auth, url, payload }, res, done) {
  // If no auth config is defined, pass to next middleware
  if (!auth) return done()

  const { gateway } = auth
  if (!gateway) throw new ReferenceError('No "gateway" defined on the config auth object')

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

    //.userCreate('brandon', 'foomar')
}
