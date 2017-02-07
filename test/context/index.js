'use strict'

const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, 'spec.js.snap'), 'utf8')
console.log('eval source')
console.log(source)

const vm = require('vm')
const sandbox = {
  exports: {}
}
vm.runInNewContext(source, sandbox)
console.log(sandbox.exports)
