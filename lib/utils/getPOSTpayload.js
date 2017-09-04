'use strict'

const querystring = require('querystring')

module.exports = function getPOSTpayload () {
  const req = this

  if (!~['POST', 'PUT'].indexOf(req.method)) {
    throw new ReferenceError(`Cannot run getPOSTpayload on a ${req.method} request.`)
  }

  return new Promise( (resolve, reject) => {
    let postData = ''
    req.on('data', data => {
      postData += data.toString()
    }).on('end', () => {
      if (postData[0] === '{') {
        resolve(JSON.parse(postData))
      } else {
        resolve(querystring.parse(payload))
      }
    })
  })
}
