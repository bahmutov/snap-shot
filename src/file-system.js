'use strict'

const fs = require('fs')
const path = require('path')
const diff = require('variable-diff')
const debug = require('debug')('snap-shot')
const la = require('lazy-ass')
const is = require('check-more-types')
const mkdirp = require('mkdirp')

const cwd = process.cwd()
const fromCurrentFolder = path.relative.bind(null, cwd)
const snapshotsFolder = fromCurrentFolder('__snapshots__')

function loadSnaps (snapshotPath) {
  const data = Object.create(null)
  if (fs.existsSync(snapshotPath)) {
    try {
      delete require.cache[require.resolve(snapshotPath)]
      /* eslint-disable no-useless-call */
      Object.assign(data, require.call(null, snapshotPath))
      /* eslint-enable no-useless-call */
    } catch (e) {}
  }
  return data
}

function fileForSpec (specFile) {
  const specName = path.basename(specFile)
  const filename = path.join(snapshotsFolder, specName + '.snap-shot')
  return path.resolve(filename)
}

function loadSnapshots (specFile) {
  la(is.unemptyString(specFile), 'missing specFile name', specFile)
  const filename = fileForSpec(specFile)
  debug('loading snapshots from %s', filename)
  let snapshots = {}
  if (fs.existsSync(filename)) {
    snapshots = loadSnaps(filename)
  } else {
    debug('could not find snapshots file %s', filename)
  }
  return snapshots
}

function saveSnapshots (specFile, snapshots) {
  mkdirp.sync(snapshotsFolder)
  const filename = fileForSpec(specFile)
  const specRelativeName = fromCurrentFolder(specFile)
  debug('saving snapshots into %s for %s', filename, specRelativeName)

  let s = ''
  Object.keys(snapshots).forEach(testName => {
    const value = snapshots[testName]
    const serialized = JSON.stringify(value, null, 2)
    s += `module.exports[\`${testName}\`] = ${serialized}\n\n`
  })
  fs.writeFileSync(filename, s, 'utf8')
  return snapshots
}

function raiseIfDifferent ({value, expected, specName}) {
  const diffed = diff(expected, value)
  if (diffed.changed) {
    const text = diffed.text
    debug('Test "%s" snapshot difference', specName)
    const msg = `snapshot difference\n${text}`
    console.log(msg)
    throw new Error(msg)
  }
}

module.exports = {
  readFileSync: fs.readFileSync,
  fromCurrentFolder,
  loadSnapshots,
  saveSnapshots,
  raiseIfDifferent
}
