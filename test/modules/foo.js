'use strict'
const callsites = require('callsites')
const relativeTo = require('path').relative.bind(null, process.cwd())
const read = require('fs').readFileSync
const resolve = require('path').resolve
const Module = require('module')
export function foo () {
  console.log('inside foo')
  // who called me?
  const caller = callsites()[1]
  console.log('caller %s line %d column %d',
    relativeTo(caller.getFileName()),
    caller.getLineNumber(),
    caller.getColumnNumber())
  try {
    throw new Error('on purpose')
  } catch (e) {
    console.log('caller', e.stack.split('\n')[2])
  }
  const filename = resolve('./call-foo.js')
  const transform = Module._extensions['.js']
  const fakeModule = {
    _compile: source => {
      console.log('transformed code')
      console.log(source)
    }
  }
  transform(fakeModule, filename)
}
// use: const foo = require('./foo').foo
