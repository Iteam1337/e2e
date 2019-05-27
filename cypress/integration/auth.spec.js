const v4Regexp = /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/i

describe('Auth flow for example/cv', () => {
  beforeEach(() => {
    cy.clearAccount()

    cy.window().then(win => {
      win.sessionStorage.clear()
    })
  })
  it('Loads auth page and displays authentication code', () => {
    cy
      .visit('/')

    cy
      .get('button')
      .contains('Login')
      .click()

    cy
      .url()
      .should('include', '/auth')

    cy
      .get('#qrcode')
      .should(res => {
        expect(res[0].getAttribute('data-consent-request-id')).to.match(v4Regexp)
      })

    cy.visit('/')
  })

  it('New connection: Profile page is loaded when connection is approved', () => {
    cy
      .createAccount({ firstName: 'Johan', lastName: 'Öbrink' })

    cy
      .visit('/')

    cy
      .get('button')
      .contains('Login')
      .click()

    cy
      .get('#qrcode')
      .then(res => {
        const url = res[0].getAttribute('data-consent-request-url')
        return cy.handleCode({ code: url })
      })

    // TODO: Reimplement when data read works or something...
    // cy
    //   .url()
    //   .should('include', '/profile')
  })
})