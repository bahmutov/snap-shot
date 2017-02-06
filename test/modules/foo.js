const callsites = require('callsites')
const relativeTo = require('path').relative.bind(null, process.cwd())
module.exports = function foo () {
  console.log('inside foo')
  // who called me?
  const caller = callsites()[1]
  console.log('caller %s line %d column %d',
    relativeTo(caller.getFileName()),
    caller.getLineNumber(),
    caller.getColumnNumber())
}
