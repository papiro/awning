'use strict'

module.exports = function originCheck (req, res, done) {
  console.log(req.headers)
  console.log('check origin and referrer')
  done()
}
