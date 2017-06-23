'use strict'

const
  util = require('util'),
  debug = util.debuglog('awning.auth')
,
  authController = new (require('./utils/AuthController'))()
;

module.exports = function auth (req, res, done) {
  global.foo = 'bar'
  req.auth = authController
  debug('testing out authController.user.create...')
  authController
    .once('user.create.success', () => {
      debug('SUCCESSFUL:::user.create')
      done()
    })
    .once('user.create.fail', err => {
      debug('ERROR:::user.create')
      throw err
    })
    .userCreate('brandon', 'foomar')
}
