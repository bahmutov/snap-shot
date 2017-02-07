'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync(path.join(__dirname, 'spec.js.snap'), 'utf8')
console.log('eval source')
console.log(source)

const sandbox = {
  module: {
    exports: {}
  }
}
vm.runInNewContext(source, sandbox)
console.log(sandbox)
