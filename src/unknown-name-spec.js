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

const thirdTest = 'third test'
it(thirdTest, function testThree () {
  snapshot('foo')
  snapshot('bar')
})
