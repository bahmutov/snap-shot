'use strict'

const fs = require('fs')
const path = require('path')

function getFilename () {
  const cwd = process.cwd()
  const folder = path.join(cwd, '.snap-shot')
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
    console.log('made folder', folder)
  }
  const filename = path.join(folder, 'snap-shot.json')
  return filename
}

function loadSnapshots () {
  const filename = getFilename()
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

module.exports = {
  readFileSync: fs.readFileSync,
  loadSnapshots,
  saveSnapshots
}
