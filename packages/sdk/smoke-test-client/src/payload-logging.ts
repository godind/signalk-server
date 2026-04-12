import { type ParsedMetadata, type ParsedValue } from '@signalk/sdk'
import { log } from './logging.js'

export function logPayloadOutcomes(outcomes: ParsedValue[]): void {
  const known = outcomes.filter((entry) => entry.schemaTypeStatus === 'known-schema-type')
  const noSchema = outcomes.filter((entry) => entry.schemaTypeStatus === 'no-schema-type')
  const unknownSchema = outcomes.filter(
    (entry) => entry.schemaTypeStatus === 'unknown-schema-type'
  )
  const invalidPath = outcomes.filter((entry) => entry.schemaTypeStatus === 'invalid-path')
  const invalidKnown = outcomes.filter(
    (entry) =>
      entry.schemaTypeStatus === 'known-schema-type' &&
      entry.validationStatus === 'invalid'
  )

  log('info', 'payload.outcomes', 'processed', {
    total: outcomes.length,
    known: known.length,
    unknown: unknownSchema.length,
    noSchema: noSchema.length,
    invalidKnown: invalidKnown.length,
    invalidPath: invalidPath.length
  })

  const knownSample = known[0]
  if (knownSample && knownSample.schemaTypeStatus === 'known-schema-type') {
    log('success', 'payload.known', 'observed', {
      path: knownSample.path,
      valueType: knownSample.valueType,
      validationStatus: knownSample.validationStatus
    })
  }

  const unknownSample = unknownSchema[0]
  if (unknownSample && unknownSample.schemaTypeStatus === 'unknown-schema-type') {
    log('warn', 'payload.unknown', 'observed', {
      path: unknownSample.path,
      valueType: unknownSample.valueType
    })
  }

  const noSchemaSample = noSchema[0]
  if (noSchemaSample && noSchemaSample.schemaTypeStatus === 'no-schema-type') {
    log('warn', 'payload.no-schema', 'observed', {
      path: noSchemaSample.path
    })
  }

  const invalidPathSample = invalidPath[0]
  if (invalidPathSample && invalidPathSample.schemaTypeStatus === 'invalid-path') {
    log('warn', 'payload.invalid-path', 'observed', {
      path: invalidPathSample.path,
      rawPath: invalidPathSample.rawPath
    })
  }

  const invalidSample = invalidKnown[0]
  if (
    invalidSample &&
    invalidSample.schemaTypeStatus === 'known-schema-type' &&
    invalidSample.validationStatus === 'invalid'
  ) {
    log('error', 'payload.invalid', 'observed', {
      path: invalidSample.path,
      valueType: invalidSample.valueType,
      errorCount: invalidSample.validationErrors.length
    })
  }
}

export function logMetadataOutcomes(outcomes: ParsedMetadata[]): void {
  const valid = outcomes.filter((entry) => entry.validationStatus === 'valid')
  const invalid = outcomes.filter((entry) => entry.validationStatus === 'invalid')
  const invalidPath = invalid.filter((entry) => entry.path === '')

  log('info', 'metadata.outcomes', 'processed', {
    total: outcomes.length,
    valid: valid.length,
    invalid: invalid.length,
    invalidPath: invalidPath.length
  })

  const invalidSample = invalid[0]
  if (
    invalidSample &&
    invalidSample.validationStatus === 'invalid' &&
    invalidSample.validationErrors
  ) {
    log('warn', 'metadata.invalid', 'observed', {
      path: invalidSample.path,
      rawPath: invalidSample.rawPath,
      errorCount: invalidSample.validationErrors.length
    })
  }
}
