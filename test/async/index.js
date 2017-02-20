const acorn = require('acorn')
require('acorn-es7-plugin')(acorn)

const falafel = require('falafel')
const fs = require('fs')
const path = require('path')
const filename = path.join(__dirname, 'test.js')
const source = fs.readFileSync(filename, 'utf8')
const removedAsyncAwait = source.replace(/async|await/g, '     ')

console.log(removedAsyncAwait)

// const options = {
//   parser: acorn,
//   plugins:{asyncawait:true},
//   ecmaVersion:7,
//   locations: true,
//   sourceType: 'module'
// }

// var code = "async function x(){ if (x) return await(x-1) ; return 0 ; }\n"
// const ast = acorn.parse(code,{
//   // Specify use of the plugin
//   plugins:{asyncawait:true},
//   // Specify the ecmaVersion
//   ecmaVersion:7
// })

// // falafel(source, options, node => {
// //   console.log(node.type)
// // })
