'use strict'

const querystring = require('querystring')

module.exports = async function getPOSTpayload () {
  const req = this

  if (!req.method === 'POST') {
    throw new ReferenceError(`Cannot run getPOSTpayload on a ${req.method} request.`)
  }
  return await new Promise( (resolve, reject) => {
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
