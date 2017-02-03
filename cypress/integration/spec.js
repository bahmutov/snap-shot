const snapshot = require('../..')
describe('snap-shot', () => {
  const url = __dirname + '/index.html'

  before(snapshot.init)

  it('works without snapshot', () => {
    expect(cy).to.be.an('object')
  })

  it.only('works', () => {
    cy.log('calling snap shot')
    snapshot('foo')
  })

  it('works with multiple lines', () => {
    cy.visit(url)
      .title().should('equal', 'snap-shot')

    // same with snap-shot multiple lines
    cy.title().then(title => {
      snapshot(title)
    })
  })

  it('works with arrow function', () => {
    cy.visit(url)
    cy.title().then(title => snapshot(title))
  })

  it('works with direct snapshot', () => {
    cy.visit(url)
    cy.title().then(snapshot)
  })

  it('can wrap Cypress', () => {
    cy.visit(url)
    snapshot(cy.title())
  })
})
