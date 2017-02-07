'use strict'

const debug = require('debug')('snap-shot')
const debugSave = require('debug')('save')
const stackSites = require('stack-sites')
const falafel = require('falafel')
const la = require('lazy-ass')
const is = require('check-more-types')
const crypto = require('crypto')
const {snapshotIndex} = require('./utils')

const isNode = Boolean(require('fs').existsSync)
const isBrowser = !isNode
const isCypress = isBrowser && typeof cy === 'object'

let fs
if (isNode) {
  fs = require('./file-system')
} else if (isCypress) {
  fs = require('./cypress-system')
} else {
  fs = require('./browser-system')
}

const shouldUpdate = Boolean(process.env.UPDATE)

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
  let foundSpecName, specSource, startLine
  const options = {
    locations: true,
    sourceType: 'module'
  }

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
      startLine = node.loc.start.line

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
    specSource,
    startLine
  }
}

function findStoredValue ({file, specName, index = 0}) {
  const relativePath = fs.fromCurrentFolder(file)
  if (shouldUpdate) {
    // let the new value replace the current value
    return
  }

  debug('loading snapshots from %s for spec %s', file, relativePath)
  const snapshots = fs.loadSnapshots(file)
  if (!snapshots) {
    return
  }

  const key = `${specName} ${index}`
  if (!(key in snapshots)) {
    return
  }

  // const values = snapshots[relativePath][specName]
  // la(is.array(values), 'missing values for spec', specName)

  // return values[index]
  return snapshots[key]
}

function storeValue ({file, specName, index, value}) {
  la(value !== undefined, 'cannot store undefined value')
  la(is.unemptyString(file), 'missing filename', file)
  la(is.unemptyString(specName), 'missing spec name', specName)
  la(is.number(index), 'missing snapshot index', file, specName, index)

  const snapshots = fs.loadSnapshots(file)
  const key = `${specName} ${index}`
  snapshots[key] = value

  fs.saveSnapshots(file, snapshots)
  debug('saved updated snapshot %d for spec %s', index, specName)

  debugSave('Saved for "%s %d" snapshot\n%s',
    specName, index, JSON.stringify(value, null, 2))
}

const isPromise = x => is.object(x) && is.fn(x.then)

function snapshot (what, update) {
  const sites = stackSites()
  if (sites.length < 3) {
    // hmm, maybe there is test (like we are inside Cypress)
    if (this && this.test && this.test.title) {
      debug('no callsite, but have test title "%s"', this.test.title)
      return this.test.title
    }
    const msg = 'Do not have caller function callsite'
    throw new Error(msg)
  }
  debug('%d callsite(s)', sites.length)

  const caller = sites[2]
  const file = caller.filename
  // TODO report function name
  // https://github.com/bahmutov/stack-sites/issues/1
  const line = caller.line
  const column = caller.column
  const message = `
    file: ${file}
    line: ${line},
    column: ${column}
  `
  debug(message)
  const {specName, specSource, startLine} =
    getSpecFunction({file, line, column})
  debug(`found spec name "${specName}" for line ${line} column ${column}`)

  if (!specName) {
    console.error('Could not determine test for %s line %d column %d',
      fs.fromCurrentFolder(file), line, column)
    return what
  }
  la(is.unemptyString(specSource), 'could not get spec source from',
    file, 'line', line, 'column', column, 'named', specName)
  la(is.number(startLine), 'could not determine spec function start line',
    file, 'line', line, 'column', column, 'named', specName)

  const snapshotRelativeLine = line - startLine

  const setOrCheckValue = value => {
    // perfect opportunity to use Maybe
    // find which snapshot (potentially) is this inside the spec file
    const index = snapshotIndex(specSource, snapshotRelativeLine)
    la(index >= 0, 'invalid snapshot index', index,
      'from source\n', specSource, '\nrelative line', snapshotRelativeLine)
    debug('spec "%s" snapshot at line %d is #%d',
      specName, snapshotRelativeLine, index)

    const expected = findStoredValue({file, specName, index})
    if (update || expected === undefined) {
      storeValue({file, specName, index, value})
    } else {
      debug('found snapshot for "%s", value', specName, expected)
      fs.raiseIfDifferent({
        value,
        expected,
        specName
      })
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
