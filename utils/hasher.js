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
;

if (require.main === module) {
  const 
    args = process.argv.slice(2),
    str = args[0],
    opts = require('sarge')(args.slice(1))
  ;

  hasher(str, opts.o || opts.output)
}

module.exports = hasher

function hasher (str, filename = '') {
  if (!str) throw new Error('Need a string to hash!')

  const hashGenerator = new Promise( (resolve, reject) => {
    // Generate salt
    crypto.randomBytes(saltLength, (err, buf) => {
      if (err) return reject(err)
    // Generate hash
      crypto.pbkdf2(str, buf.toString(), pbkdf2_iterations, pbkdf2_keylen, pbkdf2_digestAlgorithm, (err, hash) => {
        if (err) return reject(err)
        resolve(hash.toString(outputEncoding))
      })
    })  
  })

  hashGenerator
    .then( hash => {
      if (filename) {
        fs.writeFile(filename, hash, err => {
          if (err) throw err
          console.log('password written to ', path.resolve(filename))
        })
      }
      else {
        console.log(hash)
      }
    })
    .catch( err => {
      throw err
    })  
}
