'use strict'
const foo = require('./foo').foo
function callFoo() {
  console.log('calling foo from callFoo')
  foo()
}
callFoo()
