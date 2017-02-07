const snapshot = require('.')

/* global it */
it('compares just keys', () => {
  const o = {
    foo: Math.random(),
    bar: Math.random()
  }
  snapshot(Object.keys(o))
})
// snapshot will be something like
/*
exports['compares just keys 1'] = [
  "foo",
  "bar"
]
*/

const compose = (f, g) => x => f(g(x))
const upperCase = x => x.toUpperCase()
const upValue = compose(snapshot, upperCase)

it('compares upper case string', () => {
  upValue('foo')
})
/*
exports['compares upper case string 1'] = "FOO"
*/

it('compares multiple upper case values', () => {
  upValue('foo')
  upValue('bar')
  upValue('baz')
})
