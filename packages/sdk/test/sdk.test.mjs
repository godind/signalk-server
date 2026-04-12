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

test('transport parser scope and deterministic subscription format enforcement work', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all' })

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

  const fixedWithMinPeriod = {
    context: 'vessels.self',
    subscribe: [{ path: 'navigation.speedOverGround', policy: 'fixed', minPeriod: 500 }]
  }
  const fixedWithMinPeriodResult = parser.parseTransportMessage(fixedWithMinPeriod)
  assert.equal(fixedWithMinPeriodResult.ok, false)

  const instantWithPeriod = {
    context: 'vessels.self',
    subscribe: [{ path: 'navigation.speedOverGround', policy: 'instant', period: 1000 }]
  }
  const instantWithPeriodResult = parser.parseTransportMessage(instantWithPeriod)
  assert.equal(instantWithPeriodResult.ok, false)

  const fixedWithPeriod = {
    context: 'vessels.self',
    subscribe: [
      {
        path: 'navigation.speedOverGround',
        policy: 'fixed',
        period: 1000,
        format: 'delta'
      }
    ]
  }
  const fixedWithPeriodResult = parser.parseTransportMessage(fixedWithPeriod)
  assert.equal(fixedWithPeriodResult.ok, true)

  const instantWithMinPeriod = {
    context: 'vessels.self',
    subscribe: [
      {
        path: 'navigation.speedOverGround',
        policy: 'instant',
        minPeriod: 500,
        format: 'delta'
      }
    ]
  }
  const instantWithMinPeriodResult = parser.parseTransportMessage(
    instantWithMinPeriod
  )
  assert.equal(instantWithMinPeriodResult.ok, true)

  const transportDeterministicParser = sdk.createParser({
    transportScope: 'protocol-control',
    formatValidation: false
  })
  const deterministicSubscribeResult = transportDeterministicParser.parseTransportMessage(
    invalidSubscribe
  )
  assert.equal(deterministicSubscribeResult.ok, false)

  const deltaOnlyParser = sdk.createParser({ transportScope: 'delta-data' })
  const deltaOnlyProtocolResult = deltaOnlyParser.parseTransportMessage(hello)
  assert.equal(deltaOnlyProtocolResult.ok, false)
})

test('transport parser primary mode returns dominant delta errors', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({
    transportScope: 'all',
    transportErrorMode: 'primary'
  })

  const invalidDeltaCandidate = {
    context: 'vessels.self',
    updates: [
      {
        values: [{ path: 'navigation.speedOverGround', value: 6.2 }],
        $source: 'two-solar-chargers.DA:64:FC:ED:05:7E'
      }
    ]
  }

  const result = parser.parseTransportMessage(invalidDeltaCandidate)
  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('Expected parse failure for invalid delta candidate')
  }

  assert.ok(
    result.errors.includes('Input did not match transport schema=delta-data')
  )
  assert.ok(
    result.errors.some((error) =>
      error.includes('delta /updates/0/$source: must match pattern')
    )
  )
  assert.equal(
    result.errors.some((error) => error.includes('protocol-control /')),
    false
  )
  assert.equal(
    result.errors.some((error) =>
      error.includes('delta /updates/0: must have required properties meta')
    ),
    false
  )
})

test('delta update may include source when $source is present', async () => {
  const sdk = await sdkImportPromise

  const result = sdk.parseDeltaObject({
    context: 'vessels.self',
    updates: [
      {
        source: { label: 'N2K-1' },
        $source: 'NMEA0183.COM1.GP',
        values: [{ path: 'navigation.speedOverGround', value: 6.2 }]
      }
    ]
  })

  assert.equal(result.ok, true)
})

test('value parser indexes meta.type and validates known schemas', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser()
  parser.indexSchemaTypes({
    context: 'vessels.self',
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 'Position' } }]
      }
    ]
  })

  const results = parser.validateValues({
    context: 'vessels.self',
    updates: [
      {
        $source: 'NMEA0183.COM1.GP',
        values: [
          {
            path: 'navigation.position',
            value: { latitude: 60.123, longitude: 24.456 }
          }
        ]
      }
    ]
  })

  assert.equal(results.length, 1)
  assert.equal(results[0].schemaTypeStatus, 'known-schema-type')
  assert.equal(results[0].validationStatus, 'valid')
  assert.equal(results[0].valueType, 'Position')
})

test('value parser returns non-throwing unknown and invalid outcomes', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser()

  const unknownResults = parser.processValues({
    updates: [
      {
        meta: [{ path: 'navigation.mystery', value: { type: 'MadeUpType' } }],
        values: [{ path: 'navigation.mystery', value: { foo: 'bar' } }]
      }
    ]
  })

  assert.equal(unknownResults.length, 1)
  assert.equal(unknownResults[0].schemaTypeStatus, 'unknown-schema-type')
  assert.equal(unknownResults[0].validationStatus, 'not-validated')
  assert.equal(unknownResults[0].valueType, 'MadeUpType')

  const strictParser = sdk.createParser({ strictness: 'strict' })
  const strictUnknownResults = strictParser.processValues({
    updates: [
      {
        meta: [{ path: 'navigation.mystery', value: { type: 'MadeUpType' } }],
        values: [{ path: 'navigation.mystery', value: { foo: 'bar' } }]
      }
    ]
  })

  assert.equal(strictUnknownResults.length, 1)
  assert.equal(strictUnknownResults[0].schemaTypeStatus, 'unknown-schema-type')
  assert.equal(strictUnknownResults[0].validationStatus, 'invalid')
  assert.ok(Array.isArray(strictUnknownResults[0].validationErrors))
  assert.ok(strictUnknownResults[0].validationErrors.length > 0)

  const invalidResults = parser.processValues({
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 'Position' } }],
        values: [{ path: 'navigation.position', value: { latitude: 200 } }]
      }
    ]
  })

  assert.equal(invalidResults.length, 1)
  assert.equal(invalidResults[0].schemaTypeStatus, 'known-schema-type')
  assert.equal(invalidResults[0].validationStatus, 'invalid')
  assert.ok(Array.isArray(invalidResults[0].validationErrors))
  assert.ok(invalidResults[0].validationErrors.length > 0)

  const noSchemaResults = parser.validateValues({
    updates: [
      {
        values: [{ path: 'navigation.courseOverGroundTrue', value: 1.23 }]
      }
    ]
  })

  assert.equal(noSchemaResults.length, 1)
  assert.equal(noSchemaResults[0].schemaTypeStatus, 'no-schema-type')
  assert.equal(noSchemaResults[0].validationStatus, 'not-validated')

  const strictNoSchemaResults = strictParser.validateValues({
    updates: [
      {
        values: [{ path: 'navigation.courseOverGroundTrue', value: 1.23 }]
      }
    ]
  })

  assert.equal(strictNoSchemaResults.length, 1)
  assert.equal(strictNoSchemaResults[0].schemaTypeStatus, 'no-schema-type')
  assert.equal(strictNoSchemaResults[0].validationStatus, 'not-validated')
})

test('transport validation indexes meta before payload validation', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all' })

  const envelopeWithMeta = {
    context: 'vessels.self',
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 'Position' } }]
      }
    ]
  }

  const transportResult = parser.parseTransportMessage(envelopeWithMeta)
  assert.equal(transportResult.ok, true)

  const valueOnlyDelta = {
    context: 'vessels.self',
    updates: [
      {
        values: [
          {
            path: 'navigation.position',
            value: { latitude: 60.123, longitude: 24.456 }
          }
        ]
      }
    ]
  }

  const outcomes = parser.validateValues(valueOnlyDelta)
  assert.equal(outcomes.length, 1)
  assert.equal(outcomes[0].schemaTypeStatus, 'known-schema-type')
  assert.equal(outcomes[0].validationStatus, 'valid')
  assert.equal(outcomes[0].valueType, 'Position')
})

test('transport validation does not create schema mapping without metadata', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all' })

  const envelopeWithoutMeta = {
    context: 'vessels.self',
    updates: [
      {
        values: [{ path: 'navigation.position', value: { latitude: 60, longitude: 24 } }]
      }
    ]
  }

  const transportResult = parser.parseTransportMessage(envelopeWithoutMeta)
  assert.equal(transportResult.ok, true)

  const outcomes = parser.validateValues({
    context: 'vessels.self',
    updates: [
      {
        values: [{ path: 'navigation.position', value: { latitude: 60, longitude: 24 } }]
      }
    ]
  })

  assert.equal(outcomes.length, 1)
  assert.equal(outcomes[0].schemaTypeStatus, 'no-schema-type')
  assert.equal(outcomes[0].validationStatus, 'not-validated')
})

test('transport validation ignores unusable meta.type for schema indexing', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all' })

  const envelopeWithUnusableType = {
    context: 'vessels.self',
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 123 } }]
      }
    ]
  }

  const transportResult = parser.parseTransportMessage(envelopeWithUnusableType)
  assert.equal(transportResult.ok, true)

  const outcomes = parser.validateValues({
    context: 'vessels.self',
    updates: [
      {
        values: [{ path: 'navigation.position', value: { latitude: 60, longitude: 24 } }]
      }
    ]
  })

  assert.equal(outcomes.length, 1)
  assert.equal(outcomes[0].schemaTypeStatus, 'no-schema-type')
  assert.equal(outcomes[0].validationStatus, 'not-validated')
})

test('metadata parser returns valid and invalid entry outcomes', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser()

  const metadataOutcomes = parser.processMetadata({
    context: 'vessels.self',
    updates: [
      {
        $source: 'NMEA0183.COM1.GP',
        meta: [
          {
            path: 'navigation.position',
            value: { type: 'Position', units: 'rad', description: 'GPS position' }
          },
          {
            path: 'navigation.speedOverGround',
            value: { description: 42 }
          }
        ]
      }
    ]
  })

  assert.equal(metadataOutcomes.length, 2)
  assert.equal(metadataOutcomes[0].validationStatus, 'valid')
  assert.equal(metadataOutcomes[1].validationStatus, 'invalid')
  assert.ok(Array.isArray(metadataOutcomes[1].validationErrors))
  assert.ok(metadataOutcomes[1].validationErrors.length > 0)
})

test('invalid metadata does not fail transport stream parsing', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ transportScope: 'all' })
  const deltaWithInvalidMeta = {
    context: 'vessels.self',
    updates: [
      {
        meta: [
          {
            path: 'navigation.speedOverGround',
            value: { description: 42 }
          }
        ],
        values: [{ path: 'navigation.speedOverGround', value: 5.1 }]
      }
    ]
  }

  const transportResult = parser.parseTransportMessage(deltaWithInvalidMeta)
  assert.equal(transportResult.ok, true)

  const metadataResults = parser.processMetadata(deltaWithInvalidMeta)
  assert.equal(metadataResults.length, 1)
  assert.equal(metadataResults[0].validationStatus, 'invalid')
})

test('validationScope=metadata disables value routes and preserves metadata routes', async () => {
  const sdk = await sdkImportPromise

  const parser = sdk.createParser({ validationScope: 'metadata' })

  const metadataResults = parser.processMetadata({
    context: 'vessels.self',
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 'Position' } }]
      }
    ]
  })

  assert.equal(metadataResults.length, 1)
  assert.equal(metadataResults[0].validationStatus, 'valid')

  const validateValueResults = parser.validateValues({
    context: 'vessels.self',
    updates: [
      {
        values: [
          {
            path: 'navigation.position',
            value: { latitude: 60.123, longitude: 24.456 }
          }
        ]
      }
    ]
  })

  assert.deepEqual(validateValueResults, [])

  const processValueResults = parser.processValues({
    context: 'vessels.self',
    updates: [
      {
        meta: [{ path: 'navigation.position', value: { type: 'Position' } }],
        values: [
          {
            path: 'navigation.position',
            value: { latitude: 60.123, longitude: 24.456 }
          }
        ]
      }
    ]
  })

  assert.deepEqual(processValueResults, [])
})
