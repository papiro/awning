'use strict'

const
  watch = require('fs').watch,
  path = require('path')
,
  build = require('./awningBuild')
;

module.exports = function ({ axe }) {
  watch(axe, { recursive: true }, (evt, filename) => {
    if (/\.axe\.css$/.test(filename)) {
      build({ file: path.join(axe, filename) })
    }
  })
}
