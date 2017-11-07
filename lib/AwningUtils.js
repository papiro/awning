'use strict'

const crypto = require('crypto')

const timeUnitMultipliers = {
  s: 1000,
  m: 60000,
  h: 3600000,
  d: 86400000,
  w: 604800000,
  // Not possible to setInterval or setTimeout with delays larger than 2147483647.
  mo: 2592000000,
  y: 31536000000
}

Date.prototype.toAdjustedISOString = function (...args) {
  // Cache once.
  const tzo = (new Date()).getTimezoneOffset() * 60000
  // Replacer fn...
  function method () {
    return new Date(this - tzo).toISOString()
  }
  Date.prototype.toAdjustedISOString = method
  return method.apply(this, args)
}

module.exports = {
  date: {
    getMilliseconds (str) {
      if (typeof str !== 'string' || !str.test(/^\d+[smhdwmy]$/)) {
        throw new TypeError('getMilliseconds expects a string of form /^\\d+[smhdwmy]$/')
      }
      const time = str.slice(0, str.length-1)
      const timeUnit = str[-1]

      return ( time * timeUnitMultipliers[timeUnit] )
    }
  },
  uuid (length = 128) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length, (err, buff) => {
        if (err) reject(err)
        resolve(buff.toString('hex'))
      })
    })
  },
  hasher: require('./utils/hasher')
}
