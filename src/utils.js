'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const format = require('util').format

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

// make sure values in the object are "safe" to be serialized
// and compared from loaded value
function strip (o) {
  if (o === undefined) {
    throw new Error('Cannot strip whitespace from undefined value')
  }
  if (is.fn(o)) {
    la(false, 'cannot clean up functions!', o.name)
  }
  try {
    return JSON.parse(JSON.stringify(o))
  } catch (err) {
    const msg = format('Cannot strip whitespace from %j\n%s', o, err.message)
    throw new Error(msg)
  }
}

module.exports = {
  snapshotIndex,
  strip
}
