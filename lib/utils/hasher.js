'use strict'

const
  crypto = require('crypto'),
  pbkdf2_iterations = 100000,
  pbkdf2_keylen = 512,
  pbkdf2_digestAlgorithm = 'sha512',
  saltLength = 32,
  outputEncoding = 'hex'
,
  fs = require('fs'),
  path = require('path')
,
  isCLI = (require.main === module)
;

if (isCLI) {
  const 
    args = process.argv.slice(2),
    str = args[0],
    opts = require('sarge')(args.slice(1))
  ;

  hasher(str, opts.s || opts.salt)
}

module.exports = hasher

async function hasher (str, _salt) {
  if (!str) throw new Error('Need a string to hash!')

  const salt = _salt || await new Promise( (resolve, reject) => {
    // Generate salt
    crypto.randomBytes(saltLength, (err, saltBuf) => {
      if (err) return reject(err)
      resolve(saltBuf.toString(outputEncoding))
    })
  })    

  const hash = await new Promise( (resolve, reject) => {
    // Generate hash
    crypto.pbkdf2(str, salt, pbkdf2_iterations, pbkdf2_keylen, pbkdf2_digestAlgorithm, (err, hash) => {
      if (err) return reject(err)
      resolve(hash.toString(outputEncoding))
    })
  })

  if (isCLI) {
    console.log('hash: ', hash)
    if (!_salt) {
      console.log('salt: ', salt)      
    }
  } else {
    return ( _salt ? hash : { hash, salt } )
  }
}
