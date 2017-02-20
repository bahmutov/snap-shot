// dummy test that uses "async / await" keyword
test('async concat strings', async t => {
  const result = await asyncSum('f', 'oo')
  snapshot(result)
})
