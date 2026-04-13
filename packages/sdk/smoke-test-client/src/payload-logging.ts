import type { ParsedValue } from '@signalk/sdk/parser'
import type { Metadata } from '@signalk/sdk/parser'
import { log, logActivity } from './logging.js'

export function logPayloadOutcomes(outcomes: ParsedValue[]): void {
  if (outcomes.length === 0) {
    return
  }

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
    logActivity([
      {
        channel: 'log',
        level: 'warn',
        event: 'payload.unknown',
        message: 'observed',
        fields: {
          path: unknownSample.path,
          valueType: unknownSample.valueType
        }
      },
      {
        channel: 'context',
        event: 'payload.unknown',
        message: 'payload validation details',
        fields: {
          schemaTypeStatus: unknownSample.schemaTypeStatus,
          validationStatus: unknownSample.validationStatus,
          valueType: unknownSample.valueType
        }
      },
      {
        channel: 'payload',
        event: 'payload.unknown',
        message: 'payload validation sample',
        fields: {
          sample: unknownSample
        }
      }
    ])
  }

  const noSchemaSample = noSchema[0]
  if (noSchemaSample && noSchemaSample.schemaTypeStatus === 'no-schema-type') {
    logActivity([
      {
        channel: 'log',
        level: 'warn',
        event: 'payload.no-schema',
        message: 'observed',
        fields: {
          path: noSchemaSample.path
        }
      },
      {
        channel: 'context',
        event: 'payload.no-schema',
        message: 'payload validation details',
        fields: {
          schemaTypeStatus: noSchemaSample.schemaTypeStatus,
          validationStatus: noSchemaSample.validationStatus
        }
      },
      {
        channel: 'payload',
        event: 'payload.no-schema',
        message: 'payload validation sample',
        fields: {
          sample: noSchemaSample
        }
      }
    ])
  }

  const invalidPathSample = invalidPath[0]
  if (invalidPathSample && invalidPathSample.schemaTypeStatus === 'invalid-path') {
    logActivity([
      {
        channel: 'log',
        level: 'warn',
        event: 'payload.invalid-path',
        message: 'observed',
        fields: {
          path: invalidPathSample.path,
          rawPath: invalidPathSample.rawPath
        }
      },
      {
        channel: 'context',
        event: 'payload.invalid-path',
        message: 'payload validation details',
        fields: {
          schemaTypeStatus: invalidPathSample.schemaTypeStatus,
          validationStatus: invalidPathSample.validationStatus,
          rawPath: invalidPathSample.rawPath
        }
      },
      {
        channel: 'payload',
        event: 'payload.invalid-path',
        message: 'payload validation sample',
        fields: {
          sample: invalidPathSample
        }
      }
    ])
  }

  const invalidSample = invalidKnown[0]
  if (
    invalidSample &&
    invalidSample.schemaTypeStatus === 'known-schema-type' &&
    invalidSample.validationStatus === 'invalid'
  ) {
    logActivity([
      {
        channel: 'log',
        level: 'error',
        event: 'payload.invalid',
        message: 'observed',
        fields: {
          path: invalidSample.path,
          valueType: invalidSample.valueType,
          errorCount: invalidSample.validationErrors.length
        }
      },
      {
        channel: 'context',
        event: 'payload.invalid',
        message: 'payload validation details',
        fields: {
          validationErrors: invalidSample.validationErrors,
          valueType: invalidSample.valueType
        }
      },
      {
        channel: 'payload',
        event: 'payload.invalid',
        message: 'payload validation sample',
        fields: {
          sample: invalidSample
        }
      }
    ])
  }
}

export function logMetadataOutcomes(outcomes: Metadata[]): void {
  if (outcomes.length === 0) {
    return
  }

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
    logActivity([
      {
        channel: 'log',
        level: 'warn',
        event: 'metadata.invalid',
        message: 'observed',
        fields: {
          path: invalidSample.path,
          errorCount: invalidSample.validationErrors.length,
          ...(invalidSample.rawPath !== undefined
            ? { rawPath: invalidSample.rawPath }
            : {})
        }
      },
      {
        channel: 'context',
        event: 'metadata.invalid',
        message: 'metadata validation details',
        fields: {
          validationErrors: invalidSample.validationErrors,
          ...(invalidSample.rawPath !== undefined
            ? { rawPath: invalidSample.rawPath }
            : {})
        }
      },
      {
        channel: 'payload',
        event: 'metadata.invalid',
        message: 'metadata validation sample',
        fields: {
          sample: invalidSample
        }
      }
    ])
  }
}
