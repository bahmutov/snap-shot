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

it.skip('compares upper case string', () => {
  upValue('foo')
})
