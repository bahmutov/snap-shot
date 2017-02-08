const snapshot = require('.')

/* global describe, it */
describe('the number', () => {
  const number = 42

  it('is 42', () => {
    snapshot(42)
  })

  it('should be 42', () => {
    snapshot(number)
  })

  it('should be 80', () => {
    snapshot(80)
  })
})

it('compares objects', () => {
  const o = {
    inner: {
      a: 10,
      b: 20
    },
    foo: 'foo'
  }
  snapshot(o)
})

it('strips functions', () => {
  const {strip} = require('./utils')
  const o = {
    fn: () => {},
    foo: 'foo'
  }
  snapshot(strip(o))
})

it('removes functions', () => {
  const o = {
    fn: () => {},
    foo: 'foo'
  }
  // internally, o.fn will be stripped
  // before comparing
  snapshot(o)
})

it('should not store undefined value', () => {
  let value = 42
  snapshot(value)
})

// Jest mock "test"
const test = it
test('jest test', () => {
  snapshot('jest value')
})
