'use strict'

const fs = require('fs')
const path = require('path')
const diff = require('variable-diff')
const debug = require('debug')('snap-shot')
const la = require('lazy-ass')
const is = require('check-more-types')

const cwd = process.cwd()
const fromCurrentFolder = path.relative.bind(null, cwd)
const snapshotsFolder = '__snapshots__'

function getFilename () {
  const folder = path.join(cwd, '.snap-shot')
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
    console.log('made folder', folder)
  }
  const filename = path.join(folder, 'snap-shot.json')
  return filename
}

function loadSnapshots (specFile) {
  la(is.unemptyString(specFile), 'missing specFile name', specFile)
  const specName = path.basename(specFile)
  const filename = fromCurrentFolder(snapshotsFolder, specName + '.snap')
  let snapshots = {}
  if (fs.existsSync(filename)) {
    snapshots = require(filename)
    console.log('loaded snapshots from', filename)
  }
  return snapshots
}

function saveSnapshots (snapshots) {
  const filename = getFilename()
  const s = JSON.stringify(snapshots, null, 2) + '\n'
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
