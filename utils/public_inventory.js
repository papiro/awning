/*
 *  This utility script builds an array of all assets in the tree with a given root
 *  Then it writes out the path to each asset on separate lines to a file (in the given root directory)
 * */
'use strict'

const fs = require('fs')
const path = require('path')
const whitelistFilename = 'whitelist.conf'

let whitelist = []
let waitCounter = 0

module.exports = function (base) {
  function dive (dir) {
    whitelist.push(path.sep + path.relative(base, dir))

    fs.readdirSync(dir).forEach( file => {
      const stat = fs.statSync(path.join(dir, file))

      ++waitCounter

      if (stat.isDirectory()) {
        dive(path.join(dir, file))
      } else if (stat.isFile()) {
        whitelist.push(path.sep + path.relative(base, path.join(dir, file)))
      } else {
        console.log('what the heck is ', dir+file)
      }

      --waitCounter
    })

    if (!waitCounter) {
      fs.writeFileSync(path.join(base, whitelistFilename), whitelist.join('\n'))
    }
  }

  dive(base)
}
