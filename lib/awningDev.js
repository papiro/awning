'use strict'

const
  watch = require('fs').watch,
  path = require('path')
,
  { axe: buildAxe } = require('./awningBuild')
;

module.exports = function ({ axe, vars }) {
  watch(axe, { recursive: true }, (evt, filename) => {
    if (/\.axe\.css$/.test(filename)) {
      buildAxe({ file: path.join(axe, filename), vars })
    }
  })
}
