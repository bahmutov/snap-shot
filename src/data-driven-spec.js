const snapshot = require('.')

/* global describe, it */
describe('data-driven testing', () => {
  function isPrime (num) {
    for (var i = 2; i < num; i++) {
      if (num % i === 0) return false
    }
    return num > 1
  }

  const add = (a, b) => a + b

  it('finds single prime', () => {
    snapshot(isPrime, 6)
    snapshot(isPrime, 17)
    snapshot(isPrime, 73)
    snapshot(isPrime, 50)
  })

  it('finds multiple primes', () => {
    snapshot(isPrime, 1, 2, 3, 4, 5, 6, 7, 8, 9)
  })

  it('checks behavior of binary function add', () => {
    snapshot(add, [1, 2], [2, 2], [-5, 5], [10, 11])
  })
})
