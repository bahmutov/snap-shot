'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const callsites = require('stack-sites')

/* global localStorage, fetch */
la(is.object(localStorage), 'missing localStorage')

function getFilename () {
  return 'snap-shot.json'
}

function loadSnapshots () {
  const filename = getFilename()
  let snapshots = localStorage.getItem(filename)
  if (!snapshots) {
    snapshots = {}
  } else {
    snapshots = JSON.parse(snapshots)
  }
  return snapshots
}

function saveSnapshots (snapshots) {
  const filename = getFilename()
  const s = JSON.stringify(snapshots, null, 2) + '\n'
  localStorage.setItem(filename, s)
  return snapshots
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
  } else {
    return Promise.resolve()
  }
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
  readFileSync: dummyReadFileSync
}
module.exports = api
