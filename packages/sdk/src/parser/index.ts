import {
  isDeltaDataMessage,
  isProtocolControlMessage,
  type Delta,
  type ProtocolControlMessage,
  type TransportMessage,
  type TransportScope
} from '../delta/transport.js'

export type ValidationScope = 'transport' | 'payload' | 'both'

export interface ParserConfig {
  strictness?: 'lenient' | 'strict'
  validationScope?: ValidationScope
  transportScope?: TransportScope
  formatValidation?: boolean
}

export type ParseStatus = 'valid' | 'invalid'

export interface ParseSuccess<T> {
  ok: true
  status: 'valid'
  value: T
  errors: []
}

export interface ParseFailure {
  ok: false
  status: 'invalid'
  errors: string[]
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure

export interface SignalKParser {
  parseDeltaObject(value: unknown): ParseResult<Delta>
  parseDeltaJson(json: string): ParseResult<Delta>
  parseTransportMessage(value: unknown): ParseResult<TransportMessage>
}

function valid<T>(value: T): ParseSuccess<T> {
  return {
    ok: true,
    status: 'valid',
    value,
    errors: []
  }
}

function invalid(...errors: string[]): ParseFailure {
  return {
    ok: false,
    status: 'invalid',
    errors
  }
}

function parseDeltaWithMode(value: unknown): ParseResult<Delta> {
  if (!isDeltaDataMessage(value)) {
    return invalid('Input is not a valid Signal K delta object')
  }

  return valid(value)
}

function parseProtocolControlWithMode(
  value: unknown,
  formatValidation: boolean
): ParseResult<ProtocolControlMessage> {
  if (!isProtocolControlMessage(value, formatValidation)) {
    return invalid('Input is not a valid Signal K protocol-control message')
  }

  return valid(value)
}

export function parseDeltaObject(value: unknown): ParseResult<Delta> {
  return parseDeltaWithMode(value)
}

export function parseDeltaJson(json: string): ParseResult<Delta> {
  try {
    const parsed: unknown = JSON.parse(json)
    return parseDeltaWithMode(parsed)
  } catch {
    return invalid('Input is not valid JSON')
  }
}

export function createParser(config: ParserConfig = {}): SignalKParser {
  const validationScope = config.validationScope ?? 'both'
  const transportScope = config.transportScope ?? 'all'
  const formatValidation = config.formatValidation ?? true

  return {
    parseDeltaObject(value: unknown): ParseResult<Delta> {
      return parseDeltaWithMode(value)
    },
    parseDeltaJson(json: string): ParseResult<Delta> {
      return parseDeltaJson(json)
    },
    parseTransportMessage(value: unknown): ParseResult<TransportMessage> {
      if (validationScope === 'payload') {
        return invalid(
          'Transport message parsing is disabled when validationScope is payload'
        )
      }

      if (transportScope !== 'protocol-control') {
        const deltaResult = parseDeltaWithMode(value)
        if (deltaResult.ok) {
          return deltaResult
        }
      }

      if (transportScope !== 'delta-data') {
        const protocolResult = parseProtocolControlWithMode(value, formatValidation)
        if (protocolResult.ok) {
          return protocolResult
        }
      }

      return invalid(
        `Input does not match the configured transport scope (${transportScope})`
      )
    }
  }
}
