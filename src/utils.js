'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const falafel = require('falafel')
const crypto = require('crypto')
const debug = require('debug')('snap-shot')
const path = require('path')

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

function snapshotIndex ({counters, specName}) {
  la(is.object(counters), 'expected counters', counters)
  la(is.unemptyString(specName), 'expected specName', specName)
  if (!(specName in counters)) {
    counters[specName] = 1
  } else {
    counters[specName] += 1
  }
  return counters[specName]
}

function shouldTranspile () {
  const exists = require('fs').existsSync
  if (!exists) {
    return false
  }
  return exists(path.join(process.cwd(), '.babelrc'))
}

function transpile (filename) {
  debug('transpiling %s', filename)
  const babel = require('babel-core')
  const {transformFileSync} = babel
  const opts = {
    sourceMaps: 'inline'
  }
  const {code} = transformFileSync('./Link.test.js', opts)
  return code
}

function getSpecFunction ({fs, file, line}) {
  // TODO can be cached efficiently
  la(is.unemptyString(file), 'missing file', file)
  la(is.number(line), 'missing line number', line)
  const source = shouldTranspile()
    ? transpile(file)
    : fs.readFileSync(file, 'utf8')

  la(is.string(source), 'could not get source from', file)

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

      if (node.arguments.length === 2 &&
        node.arguments[1].type === 'FunctionExpression' &&
        node.arguments[1].id &&
        is.unemptyString(node.arguments[1].id.name)) {
        specName = node.arguments[1].id.name
        debug('callback function has a name "%s"', specName)
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

// make sure values in the object are "safe" to be serialized
// and compared from loaded value
function strip (o) {
  return JSON.parse(JSON.stringify(o))
}

module.exports = {
  snapshotIndex,
  getSpecFunction,
  strip
}
