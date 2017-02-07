const snapshot = require('.')

/* global describe, it */
describe('multiple snapshots', () => {
  it('handles multiple snapshots', () => {
    snapshot(1) // first snapshot
    snapshot(2) // second snapshot
  })

  it('handles multiple snapshots in if/else', () => {
    const condition = true
    if (condition) {
      snapshot(1) // first snapshot
    } else {
      snapshot(2) // second snapshot
    }
  })

  it('multiple values', () => {
    snapshot('first')
    snapshot('second')
    snapshot('third')
  })

  it('uses counter of snapshot calls', () => {
    for (let k = 0; k < 10; k += 1) {
      snapshot(`snap ${k}`)
    }
  })

  // create dynamic tests
  const names = ['test A', 'test B', 'test C']
  names.forEach(name => {
    it(name, () => {
      snapshot(name + ' works')
    })
  })
})
