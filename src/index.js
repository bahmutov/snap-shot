'use strict'

const debug = require('debug')('snap-shot')
const debugSave = require('debug')('save')
const stackSites = require('stack-sites')
const callsites = require('callsites')
const la = require('lazy-ass')
const is = require('check-more-types')
const utils = require('./utils')
const {snapshotIndex, strip} = utils

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

// keeps track how many "snapshot" calls were there per test
const snapshotsPerTest = {}

const shouldUpdate = Boolean(process.env.UPDATE)
const shouldShow = Boolean(process.env.SHOW)

function getSpecFunction ({file, line}) {
  return utils.getSpecFunction({file, line, fs})
}

const formKey = (specName, oneIndex) =>
  `${specName} ${oneIndex}`

function findStoredValue ({file, specName, index = 1}) {
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

  const key = formKey(specName, index)
  if (!(key in snapshots)) {
    return
  }

  return snapshots[key]
}

function storeValue ({file, specName, index, value}) {
  la(value !== undefined, 'cannot store undefined value')
  la(is.unemptyString(file), 'missing filename', file)
  la(is.unemptyString(specName), 'missing spec name', specName)
  la(is.positive(index), 'missing snapshot index', file, specName, index)

  const snapshots = fs.loadSnapshots(file)
  const key = formKey(specName, index)
  snapshots[key] = value

  if (shouldShow) {
    const relativeName = fs.fromCurrentFolder(file)
    console.log('saving snapshot "%s" for file %s', key, relativeName)
    console.log(value)
  }

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
  let {specName, specSource, startLine} =
    getSpecFunction({file, line, column})

  // maybe the "snapshot" function was part of composition
  // TODO handle arbitrary long chains by walking up to library code
  if (!specName) {
    const caller = sites[3]
    const file = caller.filename
    const line = caller.line
    const column = caller.column
    debug('trying to get snapshot from %s %d,%d', file, line, column)
    const out = getSpecFunction({file, line, column})
    specName = out.specName
    specSource = out.specSource
    startLine = out.startLine
  }

  if (!specName) {
    // make the file was transpiled. Try callsites search
    const sites = callsites()
    const caller = sites[1]
    const file = caller.getFileName()
    const line = caller.getLineNumber()
    const column = caller.getColumnNumber()
    debug('trying to get snapshot from callsite %s %d,%d', file, line, column)
    const out = getSpecFunction({file, line, column})
    specName = out.specName
    specSource = out.specSource
    startLine = out.startLine
  }

  if (!specName) {
    console.error('Problem finding caller')
    console.trace()

    const relativeName = fs.fromCurrentFolder(file)
    const msg = `Could not determine test for ${relativeName}
      line ${line} column ${column}`
    throw new Error(msg)
  }
  debug(`found spec name "${specName}" for line ${line} column ${column}`)
  la(is.unemptyString(specSource), 'could not get spec source from',
    file, 'line', line, 'column', column, 'named', specName)
  la(is.number(startLine), 'could not determine spec function start line',
    file, 'line', line, 'column', column, 'named', specName)

  const setOrCheckValue = any => {
    const index = snapshotIndex({specName, counters: snapshotsPerTest})
    la(is.positive(index), 'invalid snapshot index', index,
      'for\n', specName, '\ncounters', snapshotsPerTest)
    debug('spec "%s" snapshot is #%d',
      specName, index)

    const value = strip(any)
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
