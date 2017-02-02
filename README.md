# snap-shot

> Jest-like snapshot feature for the rest of us

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]

## Why

I like [Jest snapshot](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html)
idea and want it without the rest of Jest testing framework. This module is
JUST a single assertion method to be used in BDD frameworks (Mocha, Jasmine)

Also, I really really really wanted to keep API as simple and as "smart"
as possible. Thus `snap-shot` tries to find the surrounding unit test name
by inspecting its call site
(using [callsites](https://github.com/sindresorhus/callsites#readme))
and parsing AST of the spec file
(using [falafel](https://github.com/substack/node-falafel#readme)).

Snapshot values are compared using
[variable-diff](https://github.com/taylorhakes/variable-diff).

## Example

Install: `npm install --save-dev snap-shot`

```js
const snapshot = require('snap-shot')
it('is 42', () => {
  snapshot(42)
})
```

Run it first time with `mocha spec.js`.
This will create snapshots JSON values file inside `.snap-shot`.

```sh
$ mocha spec.js
$ cat .snap-shot/snap-shot.json
{
  "spec.js": {
    "is 42": 42
  }
}
```

Now modify the `spec.js` file

```js
const snapshot = require('snap-shot')
it('is 42', () => {
  snapshot(80)
})
```

```sh
$ mocha spec.js
1) is 42:
    Error: expected 42 got 80
```

**Note** `snap-shot` does not store or handle `undefined` values, since they
are likely an edge case. If you disagree, open
[an issue](https://github.com/bahmutov/snap-shot/issues) please.

## Limitations

* **single value per test** - I think the purpose of snapshots is to compare
  large objects, and it makes less sense to have multiple comparisons per
  tests. Split large tests into simpler "compute - assert"
* **Node** - it might be possible to bundle this logic into browser bundle
  but I haven't done this yet.

## Promises

For asynchronous code, please have a function inside the spec before
calling `snap-shot` or let `snap-shot` wrap the promise.

```js
it('promise to function', () => {
  return Promise.resolve(20)
    .then(data => snapshot(data))
})

it('snap-shot can wrap promise', () => {
  return snapshot(Promise.resolve('value'))
})

// does NOT work
it('promise to snapshot', () => {
  return Promise.resolve(20)
    .then(snapshot)
})
```

In the last test, the stack trace from `snap-shot` cannot get any parent
information, thus it cannot find the unit test.

## Jest

You can use this assertion inside Jest tests too.

```js
const snapshot = require('snap-shot')
test('my test', () => {
  snapshot(myValue)
})
```

## Update snapshots

To update all saved values, run with `UPDATE=1` environment variable.

```sh
$ UPDATE=1 mocha spec.js
```

To update snapshot inside a single test function, use second argument

```js
const snapshot = require('snap-shot')
it('is 42', () => {
  snapshot(80, true)
})
// snapshot file now has {"is 42": 80)
```

You can also update a single or several tests when running Mocha by filtering
the tests using [grep feature](http://mochajs.org/#g---grep-pattern).

```sh
$ UPDATE=1 mocha -g "test name pattern" *-spec.js
```

## Tests with dynamic names

Sometimes tests are generated dynamically without hardcoded names. In this
case SHA256 of the test callback function is used to find its value.

```js
// this still works
const testName = 'variable test name (value 30)'
const value = 30
it(testName, () => {
  // this is a test without hard coded name
  snapshot(value)
})
```

## Debugging

Run with `DEBUG=snap-shot` environment variable

```sh
$ DEBUG=snap-shot mocha spec.js
```

## Related

* [chai-jest-snapshot](https://github.com/suchipi/chai-jest-snapshot) if
  you are using [Chai](http://chaijs.com/)

### Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2017

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/snap-shot/issues) on Github

## MIT License

Copyright (c) 2017 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/snap-shot.svg?downloads=true
[npm-url]: https://npmjs.org/package/snap-shot
[ci-image]: https://travis-ci.org/bahmutov/snap-shot.svg?branch=master
[ci-url]: https://travis-ci.org/bahmutov/snap-shot
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
