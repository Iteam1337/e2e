const { createClientWithServer } = require('./helpers/index')
const phone = require('./helpers/phone')
const postgres = require('./helpers/operatorPostgres')

describe('jweRecipients', () => {
  let serviceClient, firstServiceConnectionId, firstServiceClientId

  beforeAll(async () => {
    await phone.clearAccount()

    await phone.createAccount({ firstName: 'Foo', lastName: 'Barsson' })

    const serviceConfig = {
      defaultPermissions: [
        {
          area: 'favorite_cats',
          types: ['WRITE'],
          description: 'The cats you like the most'
        },
        {
          area: 'favorite_cats',
          types: ['READ'],
          purpose: 'To recommend you cats that you\'ll like'
        }
      ]
    }

    serviceClient = await createClientWithServer(serviceConfig)
    firstServiceClientId = serviceClient.config.clientId
    await serviceClient.connect()

    const { url } = await serviceClient.initializeAuthentication()

    // Send it to phone
    const { connectionRequest } = await phone.handleAuthCode({ code: url })

    // Approve it!
    let approvalResponse = new Map()
    connectionRequest.permissions.forEach(p => approvalResponse.set(p.id, true))
    firstServiceConnectionId = await phone.approveConnection(connectionRequest, approvalResponse)
    const data = ['All of them']
    const area = 'favorite_cats'

    await serviceClient.data.write(firstServiceConnectionId, { area, data })
    await serviceClient.data.read(firstServiceConnectionId, { area: 'favorite_cats' })
  })

  afterAll(async (done) => {
    await phone.clearAccount()
    await postgres.clearOperatorDb()
    await serviceClient.config.keyValueStore.removeAll()
    serviceClient.server.close(done)
  })

  it('new service can read from old service', async () => {
    const serviceConfig2 = {
      defaultPermissions: [
        {
          area: 'favorite_cats',
          types: ['READ'],
          purpose: 'To recommend you cats that you\'ll like',
          domain: firstServiceClientId
        }
      ]
    }
    const serviceClient2 = await createClientWithServer(serviceConfig2)
    await serviceClient2.connect()
    const { url } = await serviceClient2.initializeAuthentication()
    const { connectionRequest } = await phone.handleAuthCode({ code: url })
    let approvalResponse = new Map()
    connectionRequest.permissions.forEach(p => approvalResponse.set(p.id, true))
    const secondConnectionId = await phone.approveConnection(connectionRequest, approvalResponse)
    const dataz = await serviceClient2.data.read(secondConnectionId, { area: 'favorite_cats', domain: firstServiceClientId })
    console.log('dattan', dataz)
  })
})
