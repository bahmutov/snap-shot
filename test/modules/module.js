'use strict'

const callsites = require('callsites')

function printSite(site, k) {
  const file = site.getFileName()
  const functionName = site.getFunctionName()
  const line = site.getLineNumber()
  const column = site.getColumnNumber()
  const message = `
    file: ${file}
    function: ${functionName}
    line: ${line},
    column: ${column}
  `
  console.log(message)
}

export function foo() {
  console.log('in foo')
  const sites = callsites()
  console.log('%d callsites', sites.length)
  try {
    throw new Error('no')
  } catch (err) {
    console.log(err.stack)
  }
  sites.forEach(printSite)
  // const caller = sites[1]
  // return line
}
