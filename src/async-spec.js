const snapshot = require('.')

/* global describe, it */
describe('async tests', () => {
  it.skip('promise to snapshot (does nothing!)', () => {
    // straight into snapshot comparison does not work
    return Promise.resolve(20)
      .then(snapshot)
  })

  it('promise to named function', () => {
    // works fine
    return Promise.resolve(20)
      .then(data => snapshot(data))
  })
})
