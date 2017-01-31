const snapshot = require('.')

/* global describe, it */
describe('the number', () => {
  const number = 42

  it('should be 42', () => {
    snapshot(number)
  })

  it('should be 80', () => {
    snapshot(80)
  })
})
