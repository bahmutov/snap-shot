'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')

function snapshotIndex (source, line) {
  la(is.unemptyString(source), 'missing function source', source)
  la(is.number(line), 'invalid line', line)
  // assume "snapshot" name for now
  const name = 'snapshot'
  const snapshots = source.split('\n').slice(0, line)
    .filter(l => l.includes(name))
  return snapshots.length
}

module.exports = {
  snapshotIndex
}
