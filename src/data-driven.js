const la = require('lazy-ass')
const is = require('check-more-types')

// is this data-driven test? for example
// snapshot(isPrime, 1, 2, 3, 4, 5)
// or
// snapshot(add, [1, 2], [-5, 5], [4, 6])
function isDataDriven (args) {
  return is.fn(args[0]) && args.length > 1
}

function dataDriven (fn, inputs) {
  la(is.fn(fn), 'expected a function for data-driven test', fn)
  la(is.unemptyString(fn.name),
    'input function is missing name', fn.toString())

  la(is.array(inputs),
    'expected list of inputs', inputs, 'to function', fn.name)
  const name = fn.name
  const behavior = inputs.map(given => {
    const args = Array.isArray(given) ? given : [given]
    return {
      given,
      expect: fn.apply(null, args)
    }
  })
  return {name, behavior}
}

module.exports = {isDataDriven, dataDriven}
