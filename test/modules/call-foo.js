const foo = require('./foo')
function callFoo() {
  console.log('calling foo from callFoo')
  foo()
}
callFoo()
