const debug = require('debug')('snap-shot')
const callsites = require('callsites')
const falafel = require('falafel')
const la = require('lazy-ass')
const is = require('check-more-types')
const fs = require('fs')
const read = fs.readFileSync
const path = require('path')
const diff = require('variable-diff')

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

function isTestFunction (name) {
  return ['it', 'test'].includes(name)
}

function getItsName ({file, line}) {
  // TODO can be cached efficiently
  const source = read(file, 'utf8')
  let foundSpecName
  const options = {locations: true}
  falafel(source, options, node => {
    if (node.type === 'CallExpression' &&
      isTestFunction(node.callee.name) &&
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
  // console.log('relativePath', relativePath)

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
  la(value !== undefined, 'cannot store undefined value')
  la(is.unemptyString(file), 'missing filename', file)
  la(is.unemptyString(specName), 'missing spec name', specName)

  const relativePath = path.relative(cwd, file)
  // console.log('relativePath', relativePath)
  if (!snapshots[relativePath]) {
    snapshots[relativePath] = {}
  }
  snapshots[relativePath][specName] = value
  const s = JSON.stringify(snapshots, null, 2) + '\n'
  fs.writeFileSync(filename, s, 'utf8')
  debug('saved updated %s with for spec %s', filename, specName)

  console.log('Saved for "%s" new snapshot value\n%s',
    specName, JSON.stringify(value))
}

function snapshot (what, update) {
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
  debug(message)
  const specName = getItsName({file, line, column})
  debug(`found spec name "${specName}" for line ${line} column ${column}`)
  if (!specName) {
    console.error('Could not determine test for %s line %d column %d',
      file, line, column)
    return
  }

  // perfect opportunity to use Maybe
  const storedValue = findStoredValue({file, specName})
  if (update || storedValue === undefined) {
    storeValue({file, specName, value: what})
  } else {
    debug('found snapshot for "%s", value', specName, storedValue)
    const diffed = diff(storedValue, what)
    if (diffed.changed) {
      const text = diffed.text
      const msg = `Test "${specName}" snapshot difference\n${text}`
      console.log(msg)
      throw new Error(msg)
    }
  }
}

module.exports = snapshot
