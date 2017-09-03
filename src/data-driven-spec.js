const snapshot = require('.')
const {isDataDriven, dataDriven} = require('./data-driven')
const la = require('lazy-ass')

/* global describe, it */
describe('data-driven testing', () => {
  function isPrime (num) {
    for (var i = 2; i < num; i++) {
      if (num % i === 0) return false
    }
    return num > 1
  }

  const add = (a, b) => a + b

  it('detects data inputs', () => {
    const args = [isPrime, 1]
    la(isDataDriven(args))
    la(!isDataDriven(isPrime, 1))
    la(!isDataDriven(isPrime))
    la(!isDataDriven(isPrime, []))
  })

  it('computes values', () => {
    const results = dataDriven(isPrime, [1, 2, 3])
    snapshot(results)
  })

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

  // a couple of tests with same name
  // because data driven should add function name
  it('works', () => {
    snapshot(isPrime, 10, 11)
  })

  it('works', () => {
    snapshot(add, [1, 2])
  })
})
