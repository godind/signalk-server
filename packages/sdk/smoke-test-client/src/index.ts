import assert from 'node:assert/strict'
import { log } from './logging.js'
import {
  createParser,
  getDeltaUpdateCount,
  isDelta,
  parseDeltaJson
} from '@signalk/sdk'

const DEFAULT_WS_URL =
  'ws://localhost:3000/signalk/v1/stream?subscribe=*&sendMeta=all'
const wsUrl = process.env.SK_WS_URL ?? DEFAULT_WS_URL
const timeoutMs = Number(process.env.SK_SMOKE_TIMEOUT_MS ?? 15000)

const parser = createParser({
  validationScope: 'transport',
  transportScope: 'all',
  formatValidation: true
})

async function waitForTransportMessage(): Promise<unknown> {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Global WebSocket is unavailable in this Node runtime')
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)

    log('info', 'ws.connect', 'connecting', { url: wsUrl })

    const timer = setTimeout(() => {
      ws.close()
      reject(
        new Error(
          `Timed out after ${timeoutMs}ms waiting for transport message from ${wsUrl}`
        )
      )
    }, timeoutMs)

    ws.addEventListener('error', (event) => {
      clearTimeout(timer)
      reject(new Error(`WebSocket connection error for ${wsUrl}: ${String(event)}`))
    })

    ws.addEventListener('message', (event) => {
      const raw =
        typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8')

      log('debug', 'ws.message.raw', 'received', { preview: raw.slice(0, 220) })

      const parsed = parseDeltaJson(raw)
      if (parsed.ok && isDelta(parsed.value)) {
        log('success', 'ws.message.classified', 'delta', {
          valid: true,
          updates: getDeltaUpdateCount(parsed.value)
        })
        clearTimeout(timer)
        ws.close()
        resolve(parsed.value)
        return
      }

      let jsonCandidate: unknown
      try {
        jsonCandidate = JSON.parse(raw)
      } catch {
        log('warn', 'ws.message.classified', 'non-json', { valid: false })
        return
      }

      const transportResult = parser.parseTransportMessage(jsonCandidate)
      if (transportResult.ok) {
        const candidate = transportResult.value as {
          name?: unknown
          version?: unknown
          self?: unknown
          roles?: unknown
        }
        const hasHelloShape =
          typeof candidate.name === 'string' ||
          typeof candidate.version === 'string' ||
          Array.isArray(candidate.roles)

        if (hasHelloShape) {
          log('success', 'ws.message.classified', 'protocol-control/hello-like', {
            valid: true,
            name: String(candidate.name ?? 'n/a'),
            version: String(candidate.version ?? 'n/a'),
            self: String(candidate.self ?? 'n/a'),
            roles: candidate.roles ?? []
          })
        } else {
          log('success', 'ws.message.classified', 'protocol-control', { valid: true })
        }
        clearTimeout(timer)
        ws.close()
        resolve(transportResult.value)
      } else {
        log('error', 'ws.message.classified', 'transport-candidate', {
          valid: false,
          errors: transportResult.errors
        })
      }
    })
  })
}

async function run(): Promise<void> {
  const message = await waitForTransportMessage()

  if (isDelta(message)) {
    assert.ok(getDeltaUpdateCount(message) >= 0)
    log('success', 'smoke.validation', 'passed', {
      kind: 'delta',
      url: wsUrl,
      updates: getDeltaUpdateCount(message)
    })
    return
  }

  const transportResult = parser.parseTransportMessage(message)
  assert.equal(transportResult.ok, true)
  log('success', 'smoke.validation', 'passed', {
    kind: 'protocol-control',
    url: wsUrl
  })
}

void run()
