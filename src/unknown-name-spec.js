const snapshot = require('.')

/* global describe, it */

const testName = 'variable test name (value 30)'
const value = 30
it(testName, () => {
  // this is a test without hard coded name
  snapshot(value)
})
