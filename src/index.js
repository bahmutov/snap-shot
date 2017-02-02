'use strict'

const debug = require('debug')('snap-shot')
const callsites = require('callsites')
const falafel = require('falafel')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const diff = require('variable-diff')
const crypto = require('crypto')

const isNode = typeof global === 'object'
const fs = isNode ? require('./file-system') : undefined

// testing callsites
// function bar () {
//   const sites = callsites()
//   return sites[0].getFileName()
// }
// function foo () {
//   return bar()
// }
// const specFileUrl = foo()

// // testing falafel
// function testFalafel (source) {
//   const options = {locations: true}
//   falafel(source, options, node => {
//     if (node.type === 'CallExpression' && node.callee.name === 'it') {
//       console.log('found node')
//       console.log(node.source())
//     }
//   })
// }
// specFileUrl is something like
// http://localhost:49829/__cypress/tests?p=cypress/integration/spec.js-438
// we will need to get "true" filename which in this case should be
// cypress/integration/spec.js
// console.log(specFileUrl)
// fetch(specFileUrl)
//   .then(r => r.text())
//   .then(testFalafel)
//   .catch(console.error)

const shouldUpdate = Boolean(process.env.UPDATE)

const cwd = process.cwd()
const fromCurrentFolder = path.relative.bind(null, cwd)

// const folder = path.join(cwd, '.snap-shot')
// if (!fs.existsSync(folder)) {
//   fs.mkdirSync(folder)
//   console.log('made folder', folder)
// }
// const filename = path.join(folder, 'snap-shot.json')
// let snapshots = {}
// if (fs.existsSync(filename)) {
//   snapshots = require(filename)
//   console.log('loaded snapshots from', filename)
// }
const snapshots = fs.loadSnapshots()

function isTestFunction (name) {
  return ['it', 'test'].includes(name)
}

function sha256 (string) {
  la(is.unemptyString(string), 'missing string to SHA', string)
  const hash = crypto.createHash('sha256')
  hash.update(string)
  return hash.digest('hex')
}

function getItsName ({file, line}) {
  // TODO can be cached efficiently
  const source = fs.readFileSync(file, 'utf8')
  let foundSpecName
  const options = {locations: true}
  falafel(source, options, node => {
    if (foundSpecName) {
      // already found
      return
    }
    if (node.type === 'CallExpression' &&
      isTestFunction(node.callee.name) &&
      node.loc.start.line < line &&
      node.loc.end.line > line) {
      debug('found test function around snapshot at line %d', line)
      // console.log(node.arguments)
      // console.log('found it')
      // console.log(node.arguments[0].value)
      // TODO handle tests where just a single function argument was used
      // it(function testThis() {...})
      const specName = node.arguments[0].value
      foundSpecName = specName

      if (!foundSpecName) {
        const source = node.arguments[1].source()
        const hash = sha256(source)
        debug('using source hash %s for found spec in %s line %d',
          hash, file, line)
        foundSpecName = hash
      }
    }
  })
  return foundSpecName
}

function findStoredValue ({file, specName}) {
  const relativePath = fromCurrentFolder(file)
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

  const relativePath = fromCurrentFolder(file)
  // console.log('relativePath', relativePath)
  if (!snapshots[relativePath]) {
    snapshots[relativePath] = {}
  }
  snapshots[relativePath][specName] = value
  fs.saveSnapshots(snapshots)
  debug('saved updated snapshot for spec %s', specName)

  console.log('Saved for "%s" new snapshot value\n%s',
    specName, JSON.stringify(value))
}

const isPromise = x => is.object(x) && is.fn(x.then)

function snapshot (what, update) {
  // TODO for multiple values inside same spec
  // we could use callsites[0] object
  const sites = callsites()
  debug('%d callsite(s)', sites.length)
  if (sites.length < 2) {
    const msg = 'Do not have caller function callsite'
    throw new Error(msg)
  }

  const caller = sites[1]
  const file = caller.getFileName()
  const functionName = caller.getFunctionName()
  const line = caller.getLineNumber()
  const column = caller.getColumnNumber()
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
      fromCurrentFolder(file), line, column)
    return what
  }

  const setOrCheckValue = value => {
    // perfect opportunity to use Maybe
    const storedValue = findStoredValue({file, specName})
    if (update || storedValue === undefined) {
      storeValue({file, specName, value})
    } else {
      debug('found snapshot for "%s", value', specName, storedValue)
      const diffed = diff(storedValue, value)
      if (diffed.changed) {
        const text = diffed.text
        debug('Test "%s" snapshot difference', specName)
        const msg = `snapshot difference\n${text}`
        console.log(msg)
        throw new Error(msg)
      }
    }

    return value
  }

  if (isPromise(what)) {
    return what.then(setOrCheckValue)
  } else {
    return setOrCheckValue(what)
  }
}

module.exports = snapshot
