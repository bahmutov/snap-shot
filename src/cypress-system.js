'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const callsites = require('stack-sites')

// storage adapter for Cypress E2E testing tool

/* global cy, expect, fetch */
const filename = 'snap-shot.json'

let snapshots

function loadSnapshots () {
  return snapshots
}

function saveSnapshots (snapshots) {
  const text = JSON.stringify(snapshots, null, 2) + '\n'
  cy.writeFile(filename, text)
}

function init () {
  // find out the source for all test -> this spec file
  const sites = callsites()
  la(sites.length, 'missing callsite')
  const specFileUrl = sites[1].filename
  la(is.webUrl(specFileUrl), 'missing spec url', specFileUrl)
  console.log('loading spec from', specFileUrl)

  // specFileUrl is something like
  // http://localhost:49829/__cypress/tests?p=cypress/integration/spec.js-438
  // we will need to get "true" filename which in this case should be
  // cypress/integration/spec.js
  const pIndex = specFileUrl.indexOf('?p=')
  const dotJsIndex = specFileUrl.indexOf('.js-', pIndex)
  const specFile = specFileUrl.substr(pIndex + 3, dotJsIndex - pIndex)
  console.log('specFile is "%s"', specFile)

  // ignore arguments for now
  api.fromCurrentFolder = () => specFile

  // cache the fetched source, otherwise every test fetches it
  const shouldFetch = api.readFileSync === dummyReadFileSync
  if (shouldFetch) {
    return fetch(specFileUrl).then(r => r.text())
      .then(source => {
        // ignores filename for now
        api.readFileSync = () => source
      })
      .then(() => {
        return fetch('/__cypress/tests?p=./' + filename)
          .then(r => r.text())
          .then(function loadedText (text) {
            if (text.includes('BUNDLE_ERROR')) {
              return Promise.reject(new Error('not found'))
            }
            cy.log('loaded snapshots', filename)
            // the JSON is wrapped in webpack wrapper ;)
            const req = eval(text) // eslint-disable-line no-eval
            snapshots = req('1')
          })
          .catch(err => {
            console.error(err)
            snapshots = {}
          })
      })
  } else {
    return Promise.resolve()
  }
}

function raiseIfDifferent ({value, expected}) {
  cy.then(() => {
    expect(value).to.equal(expected)
  })
}

function dummyReadFileSync () {
  throw new Error(`In the browser, please call snapshot.init()
    before calling tests, like this:
    const snapshot = require('snap-shot')
    beforeEach(snapshot.init)
  `)
}

// TODO replace exposed API with error methods that wait
// until "init" is called
const api = {
  loadSnapshots,
  saveSnapshots,
  init,
  readFileSync: dummyReadFileSync,
  raiseIfDifferent
}
module.exports = api
