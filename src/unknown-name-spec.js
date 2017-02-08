const snapshot = require('.')

/* global it */
const testName = 'variable test name (value 30)'
const value = 30
it(testName, () => {
  // this is a test without hard coded name
  snapshot(value)
})

const secondTest = 'second'
it(`handles template literals ${secondTest}`, () => {
  // this test has template literal instead of
  // primitive string
  snapshot(value)
})
/* snapshot uses SHA of the callback function source
exports['983ea... 1'] = "foo"
*/

const thirdTest = 'third test'
it(thirdTest, function testThree () {
  snapshot('foo')
  snapshot('bar')
})
/* uses "testThree" name
exports['testThree 1'] = "foo"

exports['testThree 2'] = "bar"
*/

// create tests on the fly with single SHA
const names = ['test A', 'test B', 'test C']
names.forEach(name => {
  it(name, () => {
    snapshot(name + ' works')
  })
})
/* snapshot will be something like
exports['7464af... 1'] = "test A works"

exports['7464af... 2'] = "test B works"

exports['7464af... 3'] = "test C works"
*/

// create tests on the fly with single name
const tests = ['test A', 'test B', 'test C']
tests.forEach(name => {
  it(name, function testSomething () {
    snapshot(name + ' works')
  })
})
/* snapshot will use "testSomething" name
exports['testSomething 1'] = "test A works"

exports['testSomething 2'] = "test B works"

exports['testSomething 3'] = "test C works"
*/
