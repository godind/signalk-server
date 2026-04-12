import test from 'node:test'
import assert from 'node:assert/strict'

const sdkImportPromise = import('../dist/index.js')

test('delta parser and guards work', async () => {
  const sdk = await sdkImportPromise

  const delta = {
    updates: [
      {
        values: [{ path: 'navigation.headingTrue', value: 1.23 }]
      }
    ]
  }

  assert.equal(sdk.isDelta(delta), true)
  assert.equal(sdk.getDeltaUpdateCount(delta), 1)

  const parsedDeltaResult = sdk.parseDeltaJson(JSON.stringify(delta))
  assert.equal(parsedDeltaResult.ok, true)
  if (!parsedDeltaResult.ok) {
    throw new Error(parsedDeltaResult.errors.join('; '))
  }

  assert.equal(sdk.getDeltaUpdateCount(parsedDeltaResult.value), 1)
})

test('parser is non-throwing for invalid input', async () => {
  const sdk = await sdkImportPromise

  const invalidResult = sdk.parseDeltaObject({ foo: 'bar' })
  assert.equal(invalidResult.ok, false)

  const invalidJsonResult = sdk.parseDeltaJson('{not-json')
  assert.equal(invalidJsonResult.ok, false)

  const invalidDeltaShapeResult = sdk.parseDeltaObject({ updates: [{}] })
  assert.equal(invalidDeltaShapeResult.ok, false)
})

test('transport parser scope and format enforcement work', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all', formatValidation: true })

  const hello = {
    name: 'signalk-server',
    version: '2.24.0',
    roles: ['master', 'main'],
    timestamp: '2026-04-12T02:29:50.820Z'
  }
  const helloResult = parser.parseTransportMessage(hello)
  assert.equal(helloResult.ok, true)

  const delta = {
    updates: [{ values: [{ path: 'navigation.speedOverGround', value: 6.2 }] }]
  }
  const deltaResult = parser.parseTransportMessage(delta)
  assert.equal(deltaResult.ok, true)

  const invalidSubscribe = {
    context: 'vessels.self',
    subscribe: [{ path: 'navigation.speedOverGround', format: 'full' }]
  }
  const invalidSubscribeResult = parser.parseTransportMessage(invalidSubscribe)
  assert.equal(invalidSubscribeResult.ok, false)

  const noFormatValidationParser = sdk.createParser({
    transportScope: 'protocol-control',
    formatValidation: false
  })
  const relaxedSubscribeResult = noFormatValidationParser.parseTransportMessage(
    invalidSubscribe
  )
  assert.equal(relaxedSubscribeResult.ok, true)

  const deltaOnlyParser = sdk.createParser({ transportScope: 'delta-data' })
  const deltaOnlyProtocolResult = deltaOnlyParser.parseTransportMessage(hello)
  assert.equal(deltaOnlyProtocolResult.ok, false)
})
