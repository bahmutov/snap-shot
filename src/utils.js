'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')

function snapshotIndex ({counters, specName}) {
  la(is.object(counters), 'expected counters', counters)
  la(is.unemptyString(specName), 'expected specName', specName)
  if (!(specName in counters)) {
    counters[specName] = 1
  } else {
    counters[specName] += 1
  }
  return counters[specName]
}

module.exports = {
  snapshotIndex
}
