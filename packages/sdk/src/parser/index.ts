import {
  DeltaDataSchema,
  ProtocolControlMessageSchema,
  type Delta,
  type ProtocolControlMessage,
  type TransportMessage,
  type TransportScope
} from '../delta/index.js'
import {
  isDeltaDataMessage,
  isProtocolControlMessage,
} from '../delta/helpers.js'
import { Value } from 'typebox/value'
import type { TSchema } from 'typebox'
import {
  createSchemaTypeIndex,
  indexSchemaTypes,
  processDeltaMetadata,
  processDeltaValues,
  validateDeltaMetadata,
  validateDeltaValues
} from './payload-parser.js'
import { compiledDeltaPayloadValidators } from './payload-validators.js'
import { compiledRestPayloadValidators } from './rest-payload-validators.js'
import type { InvalidMetadata, Metadata, ValidMetadata } from './metadata-parser.js'
import type {
  DeltaSchemaName,
  KnownDeltaValueTypeMap,
  ParsedValue
} from './schema-type-registry.js'
import type {
  KnownRestPayloadTypeMap,
  RestSchemaName
} from './rest-schema-registry.js'

export type {
  DeltaSchemaName,
  InvalidPathValue,
  InvalidValue,
  ParsedValue,
  ValidatedValue,
  ValidationError
} from './schema-type-registry.js'

export type {
  KnownRestPayloadTypeMap,
  RestSchemaName
} from './rest-schema-registry.js'

export type {
  InvalidMetadata,
  Metadata,
  MetadataValidationError,
  ValidMetadata
} from './metadata-parser.js'

export type ValidationScope = 'transport' | 'payload' | 'metadata' | 'all'
export type TransportErrorMode = 'verbose' | 'primary'

export interface ParserConfig {
  strictness?: 'lenient' | 'strict'
  validationScope?: ValidationScope
  transportScope?: TransportScope
  formatValidation?: boolean
  transportErrorMode?: TransportErrorMode
}

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

export type AllSchemaName = DeltaSchemaName | RestSchemaName

export interface SignalKParser {
  parseDeltaObject(value: unknown): ParseResult<Delta>
  parseDeltaJson(json: string): ParseResult<Delta>
  parseTransportMessage(value: unknown): ParseResult<TransportMessage>
  parseDeltaValue<K extends DeltaSchemaName>(
    schemaName: K,
    value: unknown
  ): ParseResult<KnownDeltaValueTypeMap[K]>
  parseRestPayload<K extends RestSchemaName>(
    schemaName: K,
    value: unknown
  ): ParseResult<KnownRestPayloadTypeMap[K]>

  /**
   * Update the parser's internal meta.type index from delta metadata entries.
   */
  indexSchemaTypes(delta: Delta): void

  /**
   * Validate metadata entries against static metadata schema.
   * Does not update the parser's internal meta.type index.
   */
  validateMetadata(delta: Delta): Metadata[]

  /**
   * Validate metadata entries and update the parser's internal meta.type index.
   */
  processMetadata(delta: Delta): Metadata[]

  /**
   * Validate value entries using the existing meta.type index only.
   * Does not index metadata from the same delta.
   */
  validateValues(delta: Delta): ParsedValue[]

  /**
   * Validate value entries and first index metadata from the same delta.
   */
  processValues(delta: Delta): ParsedValue[]
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

function describeValidationErrors(
  schema: TSchema,
  value: unknown,
  label: string
): string[] {
  return [...Value.Errors(schema, value)]
    .slice(0, 3)
    .map((error) => {
      const path =
        'instancePath' in error && typeof error.instancePath === 'string'
          ? error.instancePath || '/'
          : '/'

      return `${label} ${path}: ${error.message}`
    })
}

function isDeltaLikePayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { updates?: unknown }
  return Array.isArray(candidate.updates)
}

function isProtocolLikePayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    subscribe?: unknown
    unsubscribe?: unknown
    type?: unknown
    roles?: unknown
  }

  return (
    Array.isArray(candidate.subscribe) ||
    Array.isArray(candidate.unsubscribe) ||
    typeof candidate.type === 'string' ||
    Array.isArray(candidate.roles)
  )
}

function filterDeltaUnionNoise(value: unknown, errors: string[]): string[] {
  if (!isDeltaLikePayload(value)) {
    return errors
  }

  const updates = (value as { updates: unknown[] }).updates
  const removePatterns = new Set<string>()

  for (let i = 0; i < updates.length; i += 1) {
    const update = updates[i]
    if (!update || typeof update !== 'object') {
      continue
    }

    const record = update as { values?: unknown; meta?: unknown }
    const hasValues = Array.isArray(record.values)
    const hasMeta = Array.isArray(record.meta)

    if (hasValues && !hasMeta) {
      removePatterns.add(`delta /updates/${i}: must have required properties meta`)
    }
    if (hasMeta && !hasValues) {
      removePatterns.add(`delta /updates/${i}: must have required properties values`)
    }
  }

  if (removePatterns.size === 0) {
    return errors
  }

  return errors.filter((error) => !removePatterns.has(error))
}

function parseDeltaWithMode(value: unknown): ParseResult<Delta> {
  if (!isDeltaDataMessage(value)) {
    const deltaErrors = filterDeltaUnionNoise(
      value,
      describeValidationErrors(DeltaDataSchema, value, 'delta')
    )

    return invalid(
      'Input is not a valid Signal K delta object',
      ...deltaErrors
    )
  }

  return valid(value)
}

function parseProtocolControlWithMode(
  value: unknown
): ParseResult<ProtocolControlMessage> {
  if (!isProtocolControlMessage(value)) {
    return invalid(
      'Input is not a valid Signal K protocol-control message',
      ...describeValidationErrors(
        ProtocolControlMessageSchema,
        value,
        'protocol-control'
      )
    )
  }

  return valid(value)
}

export function parseDeltaObject(value: unknown): ParseResult<Delta> {
  return parseDeltaWithMode(value)
}

function parseDeltaJsonInput(json: string): ParseResult<Delta> {
  try {
    const parsed: unknown = JSON.parse(json)
    return parseDeltaWithMode(parsed)
  } catch {
    return invalid('Input is not valid JSON')
  }
}

export function parseDeltaJson(json: string): ParseResult<Delta> {
  return parseDeltaJsonInput(json)
}

export function isValidMetadata(metadata: Metadata): metadata is ValidMetadata {
  return metadata.validationStatus === 'valid'
}

export function isInvalidMetadata(
  metadata: Metadata
): metadata is InvalidMetadata {
  return metadata.validationStatus === 'invalid'
}

function parseSchemaValue<T>(
  schemaName: string,
  value: unknown,
  check: (candidate: unknown) => boolean,
  label: string,
  errors: (candidate: unknown) => Iterable<{ instancePath?: string; message: string }>
): ParseResult<T> {
  if (check(value)) {
    return valid(value as T)
  }

  return invalid(
    `Input is not a valid ${label} payload for schema=${schemaName}`,
    ...[...errors(value)].slice(0, 3).map((error) => {
      const path =
        typeof error.instancePath === 'string' && error.instancePath.length > 0
          ? error.instancePath
          : '/'

      return `${label} ${path}: ${error.message}`
    })
  )
}

function hasValidator(
  validators: Record<string, unknown>,
  schemaName: string
): boolean {
  return Object.prototype.hasOwnProperty.call(validators, schemaName)
}

export function createParser(config: ParserConfig = {}): SignalKParser {
  const strictness = config.strictness ?? 'lenient'
  const validationScope = config.validationScope ?? 'all'
  const transportScope = config.transportScope ?? 'all'
  const transportEnabled = validationScope === 'transport' || validationScope === 'all'
  const metadataEnabled = validationScope !== 'transport'
  const valueEnabled = validationScope === 'payload' || validationScope === 'all'
  const transportErrorMode = config.transportErrorMode ?? 'primary'
  const schemaTypeIndex = createSchemaTypeIndex()

  return {
    parseDeltaObject(value: unknown): ParseResult<Delta> {
      return parseDeltaWithMode(value)
    },
    parseDeltaJson(json: string): ParseResult<Delta> {
      return parseDeltaJsonInput(json)
    },
    parseTransportMessage(value: unknown): ParseResult<TransportMessage> {
      if (!transportEnabled) {
        return invalid(
          `Transport message parsing is disabled when validationScope is ${validationScope}`
        )
      }

      let deltaFailure: ParseFailure | undefined

      if (transportScope !== 'protocol-control') {
        const deltaResult = parseDeltaWithMode(value)
        if (deltaResult.ok) {
          processDeltaMetadata(deltaResult.value, schemaTypeIndex)
          return deltaResult
        }

        deltaFailure = deltaResult

        if (transportScope === 'delta-data') {
          return deltaResult
        }

        if (
          transportScope === 'all' &&
          transportErrorMode === 'primary' &&
          isDeltaLikePayload(value)
        ) {
          return invalid(
            'Input did not match transport schema=delta-data',
            ...deltaResult.errors
          )
        }
      }

      const protocolResult = parseProtocolControlWithMode(value)
      if (protocolResult.ok) {
        return protocolResult
      }

      if (transportScope === 'protocol-control') {
        return protocolResult
      }

      if (transportErrorMode === 'primary' && isProtocolLikePayload(value)) {
        return invalid(
          'Input did not match transport schema=protocol-control',
          ...protocolResult.errors
        )
      }

      return invalid(
        transportScope === 'all'
          ? 'Input did not match any transport schema for scope=all (expected delta-data or protocol-control)'
          : `Input did not match transport scope=${transportScope}`,
        ...(deltaFailure?.errors ?? []),
        ...protocolResult.errors
      )
    },
    parseDeltaValue<K extends DeltaSchemaName>(
      schemaName: K,
      value: unknown
    ): ParseResult<KnownDeltaValueTypeMap[K]> {
      const schemaNameValue = String(schemaName)
      if (!hasValidator(compiledDeltaPayloadValidators, schemaNameValue)) {
        return invalid(
          `Input referenced unknown delta schema=${schemaNameValue}`
        )
      }

      const validator = compiledDeltaPayloadValidators[schemaName]
      return parseSchemaValue<KnownDeltaValueTypeMap[K]>(
        schemaNameValue,
        value,
        (candidate) => validator.Check(candidate),
        'delta-value',
        (candidate) => validator.Errors(candidate)
      )
    },
    parseRestPayload<K extends RestSchemaName>(
      schemaName: K,
      value: unknown
    ): ParseResult<KnownRestPayloadTypeMap[K]> {
      const schemaNameValue = String(schemaName)
      if (!hasValidator(compiledRestPayloadValidators, schemaNameValue)) {
        return invalid(
          `Input referenced unknown rest schema=${schemaNameValue}`
        )
      }

      const validator = compiledRestPayloadValidators[schemaName]
      return parseSchemaValue<KnownRestPayloadTypeMap[K]>(
        schemaNameValue,
        value,
        (candidate) => validator.Check(candidate),
        'rest-payload',
        (candidate) => validator.Errors(candidate)
      )
    },
    indexSchemaTypes(delta: Delta): void {
      indexSchemaTypes(delta, schemaTypeIndex)
    },
    validateMetadata(delta: Delta) {
      if (!metadataEnabled) {
        return []
      }

      return validateDeltaMetadata(delta, schemaTypeIndex)
    },
    processMetadata(delta: Delta) {
      if (!metadataEnabled) {
        return []
      }

      return processDeltaMetadata(delta, schemaTypeIndex)
    },
    validateValues(delta: Delta) {
      if (!valueEnabled) {
        return []
      }

      return validateDeltaValues(delta, schemaTypeIndex, strictness)
    },
    processValues(delta: Delta) {
      if (!valueEnabled) {
        return []
      }

      return processDeltaValues(delta, schemaTypeIndex, strictness)
    }
  }
}
