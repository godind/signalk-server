import { log, logActivity } from './logging.js'
import { logMetadataOutcomes, logPayloadOutcomes } from './payload-logging.js'
import {
  createParser,
  getDeltaUpdateCount,
  isDelta,
  parseDeltaJson
} from '@signalk/sdk'

const DEFAULT_WS_URL =
  'ws://localhost:3000/signalk/v1/stream?subscribe=*&sendMeta=all'
const wsUrl = process.env.SK_WS_URL ?? DEFAULT_WS_URL

const VALID_VALIDATION_SCOPES = ['transport', 'payload', 'metadata', 'all'] as const
type SmokeValidationScope = (typeof VALID_VALIDATION_SCOPES)[number]
const envValidationScope = process.env.SK_VALIDATION_SCOPE
const validationScope: SmokeValidationScope =
  envValidationScope !== undefined &&
  (VALID_VALIDATION_SCOPES as readonly string[]).includes(envValidationScope)
    ? (envValidationScope as SmokeValidationScope)
    : 'all'

const parser = createParser({
  validationScope,
  transportScope: 'all'
})

function summarizeTransportFailure(errors: string[]): string {
  const specific = errors.find((line) => line.startsWith('delta ') || line.startsWith('protocol-control '))
  if (specific) {
    return specific
  }

  return errors[0] ?? 'Unknown transport parse failure'
}

function dedupeErrors(errors: string[]): string[] {
  return [...new Set(errors)]
}

async function processTransportStream(): Promise<never> {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Global WebSocket is unavailable in this Node runtime')
  }

  return new Promise((_, reject) => {
    const ws = new WebSocket(wsUrl)

    log('info', 'ws.connect', 'connecting', { url: wsUrl })

    log('info', 'smoke.runtime', 'continuous mode enabled', {
      stop: 'terminate process (Ctrl+C)'
    })

    ws.addEventListener('error', (event) => {
      reject(new Error(`WebSocket connection error for ${wsUrl}: ${String(event)}`))
    })

    ws.addEventListener('close', () => {
      reject(new Error(`WebSocket connection closed for ${wsUrl}`))
    })

    ws.addEventListener('message', (event) => {
      const raw =
        typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8')

      log('debug', 'ws.message.raw', 'received', { preview: raw.slice(0, 220) })

      const parsed = parseDeltaJson(raw)
      if (parsed.ok && isDelta(parsed.value)) {
        const metadataOutcomes = parser.processMetadata(parsed.value)
        logMetadataOutcomes(metadataOutcomes)

        const payloadOutcomes = parser.validateValues(parsed.value)
        logPayloadOutcomes(payloadOutcomes)

        if (payloadOutcomes.length === 0) {
          log('info', 'ws.message.classified', 'delta-meta-only', {
            valid: true,
            updates: getDeltaUpdateCount(parsed.value)
          })
          return
        }

        log('success', 'ws.message.classified', 'delta', {
          valid: true,
          updates: getDeltaUpdateCount(parsed.value),
          payloadEntries: payloadOutcomes.length
        })
        log('success', 'parser.validation', 'passed', {
          kind: 'delta',
          url: wsUrl,
          updates: getDeltaUpdateCount(parsed.value)
        })
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
      } else {
        const parserErrors = dedupeErrors(transportResult.errors)
        logActivity([
          {
            channel: 'log',
            level: 'error',
            event: 'ws.message.classified',
            message: 'transport-candidate',
            fields: {
              valid: false,
              error: summarizeTransportFailure(parserErrors)
            }
          },
          {
            channel: 'context',
            event: 'ws.message.classified',
            message: 'transport parser validation details',
            fields: {
              errors: parserErrors
            }
          },
          {
            channel: 'payload',
            event: 'ws.message.classified',
            message: 'offending transport candidate',
            fields: {
              raw,
              jsonCandidate
            }
          }
        ])
      }
    })
  })
}

async function run(): Promise<void> {
  await processTransportStream()
}

void run()
