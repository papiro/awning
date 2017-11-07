'use strict'

const
  watch = require('fs').watch,
  path = require('path')
,
  { axe: buildAxe } = require('./awningBuild')
;

module.exports = function ({ axe, vars }) {
  [].concat(axe).forEach( dir => {
    watch(dir, { recursive: true }, (evt, filename) => {
      if (/\.axe\.css$/.test(filename)) {
        buildAxe({ file: path.join(dir, filename), vars })
      }
    })
  })
}
