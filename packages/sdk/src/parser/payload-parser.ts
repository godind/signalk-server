import type { Delta } from '../delta/transport.js'
import type { Validator } from 'typebox/compile'
import type { MetadataValuePayload, ParsedMetadata } from './metadata-parser.js'
import {
  KnownValueSchemaRegistry,
  type InvalidPathValue,
  type InvalidValue,
  type NoSchemaTypeValue,
  type NormalizedDeltaValueBase,
  type ParsedValue,
  type SignalKSchemaName,
  type UnknownSchemaTypeInvalidValue,
  type UnknownSchemaTypeValue,
  type ValidationError,
  type ValidatedValue
} from './schema-type-registry.js'
import {
  createCompiledMetadataValidator,
  createCompiledPayloadValidators
} from './payload-validators.js'

const compiledMetadataValidator = createCompiledMetadataValidator()
const compiledPayloadValidators = createCompiledPayloadValidators()

type MetadataProcessingMode = 'index-only' | 'validate-only' | 'index-and-validate'
type Strictness = 'lenient' | 'strict'

export interface SchemaTypeIndexView {
  setValueType(path: string, typeName: string): void
  lookupValueType(path: string): string | undefined
  lookupSchemaName(path: string): SignalKSchemaName | undefined
}

export function createSchemaTypeIndex(): SchemaTypeIndexView {
  return new SchemaTypeIndex()
}

export function indexSchemaTypes(delta: Delta, index: SchemaTypeIndexView): void {
  processMetadataEntries(delta, index, 'index-only')
}

export function validateDeltaMetadata(
  delta: Delta,
  index: SchemaTypeIndexView
): ParsedMetadata[] {
  return processMetadataEntries(delta, index, 'validate-only')
}

export function processDeltaMetadata(
  delta: Delta,
  index: SchemaTypeIndexView
): ParsedMetadata[] {
  return processMetadataEntries(delta, index, 'index-and-validate')
}

export function validateDeltaValues(
  delta: Delta,
  index: SchemaTypeIndexView,
  strictness: Strictness = 'lenient'
): ParsedValue[] {
  return processValueEntries(delta, index, false, strictness)
}

export function processDeltaValues(
  delta: Delta,
  index: SchemaTypeIndexView,
  strictness: Strictness = 'lenient'
): ParsedValue[] {
  return processValueEntries(delta, index, true, strictness)
}

function processValueEntries(
  delta: Delta,
  index: SchemaTypeIndexView,
  includeDeltaMetadata: boolean,
  strictness: Strictness
): ParsedValue[] {
  if (includeDeltaMetadata) {
    processMetadataEntries(delta, index, 'index-only')
  }

  const accepted: ParsedValue[] = []
  const context = typeof delta.context === 'string' ? delta.context : 'vessels.self'

  for (const update of delta.updates) {
    const timestamp = update.timestamp
    const sourceRef = update.$source ?? 'unknown-source'

    if (!('values' in update) || !Array.isArray(update.values)) {
      continue
    }

    for (const valueEntry of update.values) {
      const path = valueEntry.path
      if (!isValidPath(path)) {
        accepted.push({
          context,
          $source: sourceRef,
          path: '',
          rawPath: path,
          value: valueEntry.value,
          ...(timestamp ? { timestamp } : {}),
          schemaTypeStatus: 'invalid-path',
          validationStatus: 'invalid',
          validationErrors: [
            {
              path: '/path',
              message: 'Value entry path must be a non-empty string'
            }
          ]
        } satisfies InvalidPathValue)
        continue
      }

      const base: NormalizedDeltaValueBase = {
        context,
        $source: sourceRef,
        path,
        ...(timestamp ? { timestamp } : {})
      }

      const valueType = index.lookupValueType(path)
      if (!valueType) {
        accepted.push({
          ...base,
          value: valueEntry.value,
          schemaTypeStatus: 'no-schema-type',
          validationStatus: 'not-validated'
        } satisfies NoSchemaTypeValue)
        continue
      }

      const schemaName = index.lookupSchemaName(path)
      if (!schemaName) {
        if (strictness === 'strict') {
          accepted.push({
            ...base,
            value: valueEntry.value,
            valueType,
            schemaTypeStatus: 'unknown-schema-type',
            validationStatus: 'invalid',
            validationErrors: [
              {
                path: '/meta/type',
                message: `Unknown schema type: ${valueType}`
              }
            ]
          } satisfies UnknownSchemaTypeInvalidValue)
        } else {
          accepted.push({
            ...base,
            value: valueEntry.value,
            valueType,
            schemaTypeStatus: 'unknown-schema-type',
            validationStatus: 'not-validated'
          } satisfies UnknownSchemaTypeValue)
        }

        continue
      }

      const candidate = { ...base, value: valueEntry.value }
      const validator = compiledPayloadValidators[schemaName]
      if (validator.Check(candidate)) {
        accepted.push({
          ...candidate,
          schemaName,
          valueType: schemaName,
          schemaTypeStatus: 'known-schema-type',
          validationStatus: 'valid'
        } as ValidatedValue)
      } else {
        accepted.push({
          ...base,
          value: valueEntry.value,
          schemaName,
          valueType: schemaName,
          schemaTypeStatus: 'known-schema-type',
          validationStatus: 'invalid',
          validationErrors: getValidationErrors(validator, candidate)
        } as InvalidValue)
      }
    }
  }

  return accepted
}

function processMetadataEntries(
  delta: Delta,
  index: SchemaTypeIndexView,
  mode: MetadataProcessingMode
): ParsedMetadata[] {
  const updateIndex = mode !== 'validate-only'
  const collectResults = mode !== 'index-only'
  const results: ParsedMetadata[] = []
  const context = typeof delta.context === 'string' ? delta.context : 'vessels.self'

  for (const update of delta.updates) {
    const timestamp = update.timestamp
    const sourceRef = update.$source ?? 'unknown-source'

    if (!('meta' in update) || !Array.isArray(update.meta)) {
      continue
    }

    for (const metaEntry of update.meta) {
      if (!isValidPath(metaEntry.path)) {
        if (collectResults) {
          results.push({
            context,
            $source: sourceRef,
            path: '',
            rawPath: metaEntry.path,
            value: metaEntry.value,
            ...(timestamp ? { timestamp } : {}),
            validationStatus: 'invalid',
            validationErrors: [
              {
                path: '/path',
                message: 'Metadata entry path must be a non-empty string'
              }
            ]
          })
        }

        continue
      }

      const metaValue = metaEntry.value
      const path = metaEntry.path

      if (
        updateIndex &&
        isObject(metaEntry.value) &&
        typeof metaEntry.value.type === 'string'
      ) {
        index.setValueType(path, metaEntry.value.type)
      }

      if (!collectResults) {
        continue
      }

      const base = {
        context,
        $source: sourceRef,
        path,
        ...(timestamp ? { timestamp } : {})
      }

      if (compiledMetadataValidator.Check(metaEntry)) {
        results.push({
          ...base,
          value: metaValue as MetadataValuePayload,
          validationStatus: 'valid'
        })
      } else {
        results.push({
          ...base,
          value: metaValue,
          validationStatus: 'invalid',
          validationErrors: getValidationErrors(compiledMetadataValidator, metaEntry)
        })
      }
    }
  }

  return results
}

function hasKnownSchemaName(value: string): value is SignalKSchemaName {
  return Object.prototype.hasOwnProperty.call(KnownValueSchemaRegistry, value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidPath(path: unknown): path is string {
  return typeof path === 'string' && path.length > 0
}

function getValidationErrors(
  validator: Validator,
  value: unknown
): ValidationError[] {
  return [...validator.Errors(value)].map((error) => ({
    path:
      'instancePath' in error && typeof error.instancePath === 'string'
        ? error.instancePath
        : '',
    message: error.message
  }))
}

class SchemaTypeIndex {
  private readonly pathToMetaType = new Map<string, string>()

  setValueType(path: string, typeName: string): void {
    if (path.length === 0 || typeName.length === 0) {
      return
    }

    this.pathToMetaType.set(path, typeName)
  }

  lookupValueType(path: string): string | undefined {
    return this.pathToMetaType.get(path)
  }

  lookupSchemaName(path: string): SignalKSchemaName | undefined {
    const raw = this.lookupValueType(path)
    if (!raw) {
      return undefined
    }

    return hasKnownSchemaName(raw) ? raw : undefined
  }
}
