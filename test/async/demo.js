// Require acorn as usual
var acorn = require("acorn");
// Add the es7-plugin
require('acorn-es7-plugin')(acorn)

var code = "async function x(){ if (x) return await(x-1) ; return 0 ; }\n";
var ast = acorn.parse(code,{
    // Specify use of the plugin
    plugins:{asyncawait:true},
    // Specify the ecmaVersion
    ecmaVersion:7
}) ;
// Show the AST
console.log(JSON.stringify(ast,null,2)) ;
