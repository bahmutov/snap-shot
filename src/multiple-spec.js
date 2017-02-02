const snapshot = require('.')

/* global describe, it */
describe('multiple snapshots', () => {
  it('handles multiple snapshots', () => {
    snapshot(1) // first snapshot
    // snapshot(2) // second snapshot
  })

  it('handles multiple snapshots in if/else', () => {
    const condition = true
    if (condition) {
      snapshot(1) // first snapshot
    } else {
      snapshot(2) // second snapshot
    }
  })
})
