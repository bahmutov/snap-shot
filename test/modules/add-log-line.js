const hook = require('node-hook')
function addLogLine (source, filename) {
  if (filename.endsWith('call-foo.js')) {
    console.log('inserting first line into call-foo.js')
    return 'console.log("first line in call-foo.js")\n' + source
  }
  return source
}
hook.hook('.js', addLogLine)
