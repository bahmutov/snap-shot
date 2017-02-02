'use strict'

const debug = require('debug')('snap-shot')
const callsites = require('callsites')
const falafel = require('falafel')
const la = require('lazy-ass')
const is = require('check-more-types')
const diff = require('variable-diff')
const crypto = require('crypto')

// does this test work with jsdom?
const isBrowser = typeof window === 'object' &&
  (typeof global === 'undefined' || window === global)
const isNode = !isBrowser
const fs = isNode ? require('./file-system') : require('./browser-system')

const shouldUpdate = Boolean(process.env.UPDATE)

const snapshots = fs.loadSnapshots()

function isTestFunctionName (name) {
  return ['it', 'test'].includes(name)
}

function isTestFunction (node) {
  if (node.type === 'Identifier') {
    return isTestFunctionName(node.name)
  }
  if (node.type === 'MemberExpression') {
    return isTestFunctionName(node.object.name)
  }
}

function sha256 (string) {
  la(is.unemptyString(string), 'missing string to SHA', string)
  const hash = crypto.createHash('sha256')
  hash.update(string)
  return hash.digest('hex')
}

function getSpecFunction ({file, line}) {
  // TODO can be cached efficiently
  const source = fs.readFileSync(file, 'utf8')
  let foundSpecName, specSource
  const options = {locations: true}

  falafel(source, options, node => {
    if (foundSpecName) {
      // already found
      return
    }
    if (node.type === 'CallExpression' &&
      isTestFunction(node.callee) &&
      node.loc.start.line < line &&
      node.loc.end.line > line) {
      debug('found test function around snapshot at line %d', line)

      if (node.arguments.length !== 2) {
        throw new Error('Cannot get test name for ' + node.source())
      }

      specSource = node.arguments[1].source()

      // console.log(node.source())
      // console.log(node.arguments[0])

      // console.log('found it')
      // console.log(node.arguments[0].value)
      // TODO handle tests where just a single function argument was used
      // it(function testThis() {...})
      let specName

      const nameNode = node.arguments[0]
      if (nameNode.type === 'TemplateLiteral') {
        specName = nameNode.source().replace(/`/g, '')
        debug('template literal name "%s"', specName)
      } else if (nameNode.type === 'Literal') {
        specName = nameNode.value
        debug('regular string name "%s", specName')
      } else {
        // TODO handle single function
      }

      foundSpecName = specName

      if (!foundSpecName) {
        const hash = sha256(specSource)
        debug('using source hash %s for found spec in %s line %d',
          hash, file, line)
        foundSpecName = hash
      }
    }
  })
  return {
    specName: foundSpecName,
    specSource
  }
}

function findStoredValue ({file, specName}) {
  const relativePath = fs.fromCurrentFolder(file)
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

  const relativePath = fs.fromCurrentFolder(file)
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
  if (sites.length < 2) {
    // hmm, maybe there is test (like we are inside Cypress)
    if (this && this.test && this.test.title) {
      debug('no callsite, but have test title "%s"', this.test.title)
      return this.test.title
    }
    const msg = 'Do not have caller function callsite'
    throw new Error(msg)
  }
  debug('%d callsite(s)', sites.length)

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
  const {specName, specSource} = getSpecFunction({file, line, column})
  debug(`found spec name "${specName}" for line ${line} column ${column}`)

  if (!specName) {
    console.error('Could not determine test for %s line %d column %d',
      fs.fromCurrentFolder(file), line, column)
    return what
  }
  la(is.unemptyString(specSource), 'could not get spec source from',
    file, 'line', line, 'column', column, 'named', specName)

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

if (isBrowser) {
  // there might be async step to load test source code in the browser
  la(is.fn(fs.init), 'browser file system is missing init', fs)
  snapshot.init = fs.init
}

module.exports = snapshot
