'use strict'

// import {foo} from './module'
const foo = require('./module').foo

const line = foo()
console.assert(line === 3, 'determined the line number')
