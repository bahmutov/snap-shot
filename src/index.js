const callsites = require('callsites')
const falafel = require('falafel')
const la = require('lazy-ass')
const R = require('ramda')
const fs = require('fs')
const read = fs.readFileSync
const path = require('path')

const shouldUpdate = Boolean(process.env.UPDATE)

const cwd = process.cwd()
const folder = path.join(cwd, '.snap-shot')
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
  console.log('made folder', folder)
}
const filename = path.join(folder, 'snap-shot.json')
let snapshots = {}
if (fs.existsSync(filename)) {
  snapshots = require(filename)
  console.log('loaded snapshots from', filename)
}

function getItsName ({file, line}) {
  // TODO can be cached efficiently
  const source = read(file, 'utf8')
  let foundSpecName
  const options = {locations: true}
  falafel(source, options, node => {
    if (node.type === 'CallExpression' &&
      node.callee.name === 'it' &&
      node.loc.start.line < line &&
      node.loc.end.line > line) {
      // console.log('found it')
      // console.log(node.arguments[0].value)
      foundSpecName = node.arguments[0].value
    }
  })
  return foundSpecName
}

function findStoredValue ({file, specName}) {
  const relativePath = path.relative(cwd, file)
  console.log('relativePath', relativePath)

  if (shouldUpdate) {
    // let the new value replace the current value
    return
  }

  if (!snapshots[relativePath]) {
    return
  }
  if (!(specName in snapshots[relativePath])) {
    return
  }
  return snapshots[relativePath][specName]
}

function storeValue ({file, specName, value}) {
  const relativePath = path.relative(cwd, file)
  console.log('relativePath', relativePath)
  if (!snapshots[relativePath]) {
    snapshots[relativePath] = {}
  }
  snapshots[relativePath][specName] = value
  const s = JSON.stringify(snapshots, null, 2) + '\n'
  fs.writeFileSync(filename, s, 'utf8')
  console.log('saved', filename)
}

function snapshot (what, update) {
  la(what !== undefined, 'cannot store undefined value')

  // TODO for multiple values inside same spec
  // we could use callsites[0] object
  const callsite = callsites()[1]
  const file = callsite.getFileName()
  const functionName = callsite.getFunctionName()
  const line = callsite.getLineNumber()
  const column = callsite.getColumnNumber()
  const message = `
    file: ${file}
    function: ${functionName}
    line: ${line},
    column: ${column}
  `
  console.log(message)
  const specName = getItsName({file, line, column})
  console.log(`found spec name "${specName}"`)

  // perfect opportunity to use Maybe
  const storedValue = findStoredValue({file, specName})
  console.log('stored value', storedValue)
  if (update || storedValue === undefined) {
    storeValue({file, specName, value: what})
  } else {
    la(R.equals(what, storedValue), 'expected', storedValue, 'got', what)
  }
}

module.exports = snapshot
