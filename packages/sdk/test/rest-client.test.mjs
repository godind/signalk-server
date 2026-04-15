import test from 'node:test'
import assert from 'node:assert/strict'

const restImportPromise = import('../dist/rest/index.js')

function createFetchMock(handler) {
  return async (input, init) => {
    return handler(String(input), init)
  }
}

test('rest.request returns undefined on 204 no-content', async () => {
  const { SignalKRestClient } = await restImportPromise

  const fetchImpl = createFetchMock(async () => ({
    ok: true,
    status: 204,
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input')
    }
  }))

  const client = new SignalKRestClient({
    baseUrl: 'http://localhost:3000',
    fetchImpl
  })

  const result = await client.request({
    method: 'GET',
    path: '/signalk/v1/api/no-content'
  })

  assert.equal(result, undefined)
})

test('rest.request rethrows malformed JSON parse errors', async () => {
  const { SignalKRestClient } = await restImportPromise

  const fetchImpl = createFetchMock(async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON at position 0')
    }
  }))

  const client = new SignalKRestClient({
    baseUrl: 'http://localhost:3000',
    fetchImpl
  })

  await assert.rejects(
    () =>
      client.request({
        method: 'GET',
        path: '/signalk/v1/api/bad-json'
      }),
    /Unexpected token </
  )
})

test('rest.requestNoContent enforces 204 responses', async () => {
  const { SignalKRestClient } = await restImportPromise

  const fetchImpl = createFetchMock(async () => ({
    ok: true,
    status: 200,
    json: async () => ({})
  }))

  const client = new SignalKRestClient({
    baseUrl: 'http://localhost:3000',
    fetchImpl
  })

  await assert.rejects(
    () =>
      client.requestNoContent({
        method: 'DELETE',
        path: '/signalk/v1/api/some-resource'
      }),
    /Expected 204 No Content, got 200/
  )
})

test('rest.request preserves caller content-type header casing choice', async () => {
  const { SignalKRestClient } = await restImportPromise

  const fetchImpl = createFetchMock(async (_input, init) => {
    assert.equal(init?.headers?.['content-type'], 'application/custom+json')
    assert.equal(init?.headers?.['Content-Type'], undefined)

    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    }
  })

  const client = new SignalKRestClient({
    baseUrl: 'http://localhost:3000',
    fetchImpl
  })

  const result = await client.request({
    method: 'POST',
    path: '/signalk/v1/api/custom',
    headers: {
      'content-type': 'application/custom+json'
    },
    body: { foo: 'bar' }
  })

  assert.deepEqual(result, { ok: true })
})

test('weather.getWarnings returns and is used as array', async () => {
  const { SignalKRestClient } = await restImportPromise

  const warningsPayload = [
    {
      startTime: '2026-04-14T08:00:00.000Z',
      endTime: '2026-04-14T10:00:00.000Z',
      details: 'Strong wind warning.',
      source: 'MyWeatherService',
      type: 'Warning'
    }
  ]

  const fetchImpl = createFetchMock(async (input) => {
    assert.ok(input.endsWith('/signalk/v1/api/weather/warnings'))
    return {
      ok: true,
      status: 200,
      json: async () => warningsPayload
    }
  })

  const client = new SignalKRestClient({
    baseUrl: 'http://localhost:3000',
    fetchImpl
  })

  const warnings = await client.weather.getWarnings({
    path: '/signalk/v1/api/weather/warnings'
  })

  assert.equal(Array.isArray(warnings), true)
  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].details, 'Strong wind warning.')

  const summary = warnings.map((warning) => warning.type).join(',')
  assert.equal(summary, 'Warning')
})
