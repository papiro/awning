'use strict'

const 
  args = process.argv.slice(2),
  str = args[0],
  opts = require('sarge')(args.slice(1))
;

if (!str) throw new Error('Need a string to hash!')

const
  crypto = require('crypto'),
  hashAlgorithm = 'sha512',
  digestEncoding = 'hex'
,
  hash = crypto.createHash(hashAlgorithm)
,
  fs = require('fs'),
  path = require('path')
;

hash.update(str)

let filename = ''
if (filename = ( opts.o || opts.output )) {
  fs.writeFile(filename, hash.digest(digestEncoding), err => {
    if (err) throw err
    console.log('password written to ', path.resolve(filename))
  })
}

else {
  console.log(hash.digest(digestEncoding))
}
