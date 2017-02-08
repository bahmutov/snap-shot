/* global describe, it */
const utils = require('./utils')
const la = require('lazy-ass')

describe('strip', () => {
  const {strip} = utils
  const o = {
    fn: () => {},
    foo: 'foo'
  }
  it('returns new object', () => {
    const result = strip(o)
    la(result !== o)
  })

  it('keeps string property', () => {
    const result = strip(o)
    la(result.foo === o.foo)
  })

  it('removes function property', () => {
    const result = strip(o)
    la(!result.fn)
  })
})
