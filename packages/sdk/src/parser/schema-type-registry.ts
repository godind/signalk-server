import Type, { type TSchema } from 'typebox'
import {
  NotificationSchema,
  PositionSchema
} from '@signalk/server-api/typebox'

// PositionSchema is intentionally imported from server-api/typebox.
// SDK parser validation should track server-api as the single schema source.

/**
 * Schema-type registry for payload parsing.
 *
 * Extension guide (single source of truth):
 * 1. Define a new `*DeltaValueSchema` in this file.
 * 2. Add one entry to `KnownDeltaValueSchemaRegistry` where:
 *    - key = incoming `meta.type` string
 *    - value = matching TypeBox schema for the normalized delta payload
 *
 * Automation provided by this module:
 * - `DeltaSchemaName` is auto-derived from registry keys.
 * - `KnownDeltaValueTypeMap` is auto-derived from registry schemas via `Type.Static`.
 * - `ValidatedValue` and `InvalidValue` unions are auto-derived from
 *   `DeltaSchemaName` and `KnownDeltaValueTypeMap`.
 *
 * Practical rule: when adding a new schema type, update only the schema
 * definition and the registry entry. Do not manually edit the derived unions.
 */

const NormalizedDeltaValueBaseSchema = Type.Object(
  {
    context: Type.String(),
    $source: Type.String(),
    source: Type.Optional(Type.Unknown()),
    path: Type.String(),
    timestamp: Type.Optional(Type.String())
  }
)

export type NormalizedDeltaValueBase = Type.Static<
  typeof NormalizedDeltaValueBaseSchema
>

const NumericDeltaValueSchema = Type.Intersect([
  NormalizedDeltaValueBaseSchema,
  Type.Object({
    value: Type.Union([Type.Number(), Type.Null()])
  })
])

const PositionDeltaValueSchema = Type.Intersect([
  NormalizedDeltaValueBaseSchema,
  Type.Object({
    // Server API schemas are consumed as external TypeBox instances.
    // Cast keeps registry generic over local TSchema references.
    value: Type.Union([PositionSchema as unknown as TSchema, Type.Null()])
  })
])

const NotificationDeltaValueSchema = Type.Intersect([
  NormalizedDeltaValueBaseSchema,
  Type.Object({
    // Server API schemas are consumed as external TypeBox instances.
    // Cast keeps registry generic over local TSchema references.
    value: Type.Union([NotificationSchema as unknown as TSchema, Type.Null()])
  })
])

function defineSchemaTypeRegistry<const T extends Record<string, TSchema>>(
  registry: T
): T {
  return registry
}

export const KnownDeltaValueSchemaRegistry = defineSchemaTypeRegistry({
  Numeric: NumericDeltaValueSchema,
  Position: PositionDeltaValueSchema,
  Notification: NotificationDeltaValueSchema
})

export type DeltaSchemaName = keyof typeof KnownDeltaValueSchemaRegistry

export type SchemaTypeStatus =
  | 'no-schema-type'
  | 'unknown-schema-type'
  | 'invalid-path'
  | 'known-schema-type'

export type ValidationStatus = 'not-validated' | 'valid' | 'invalid'

export interface ValidationError {
  path: string
  message: string
}

export type KnownDeltaValueTypeMap = {
  [K in DeltaSchemaName]: Type.Static<(typeof KnownDeltaValueSchemaRegistry)[K]>
}

export type NumericDeltaValue = KnownDeltaValueTypeMap['Numeric']
export type PositionDeltaValue = KnownDeltaValueTypeMap['Position']
export type NotificationDeltaValue = KnownDeltaValueTypeMap['Notification']

type KnownSchemaTag<K extends DeltaSchemaName> = {
  schemaName: K
  valueType: K
  schemaTypeStatus: 'known-schema-type'
}

type KnownSchemaValidated<K extends DeltaSchemaName> = KnownDeltaValueTypeMap[K] &
  KnownSchemaTag<K> & {
    validationStatus: 'valid'
  }

type KnownSchemaInvalid<K extends DeltaSchemaName> = NormalizedDeltaValueBase &
  KnownSchemaTag<K> & {
    value: unknown
    validationStatus: 'invalid'
    validationErrors: ValidationError[]
  }

export type ValidatedValue = {
  [K in DeltaSchemaName]: KnownSchemaValidated<K>
}[DeltaSchemaName]

export type InvalidValue = {
  [K in DeltaSchemaName]: KnownSchemaInvalid<K>
}[DeltaSchemaName]

export type NoSchemaTypeValue = NormalizedDeltaValueBase & {
  value: unknown
  schemaName?: undefined
  valueType?: undefined
  schemaTypeStatus: 'no-schema-type'
  validationStatus: 'not-validated'
}

export type UnknownSchemaTypeValue = NormalizedDeltaValueBase & {
  value: unknown
  schemaName?: undefined
  valueType: string
  schemaTypeStatus: 'unknown-schema-type'
  validationStatus: 'not-validated'
}

export type UnknownSchemaTypeInvalidValue = NormalizedDeltaValueBase & {
  value: unknown
  schemaName?: undefined
  valueType: string
  schemaTypeStatus: 'unknown-schema-type'
  validationStatus: 'invalid'
  validationErrors: ValidationError[]
}

export type InvalidPathValue = Omit<NormalizedDeltaValueBase, 'path'> & {
  path: ''
  rawPath: unknown
  value: unknown
  schemaName?: undefined
  valueType?: undefined
  schemaTypeStatus: 'invalid-path'
  validationStatus: 'invalid'
  validationErrors: ValidationError[]
}

export type ParsedValue =
  | ValidatedValue
  | InvalidValue
  | InvalidPathValue
  | NoSchemaTypeValue
  | UnknownSchemaTypeValue
  | UnknownSchemaTypeInvalidValue
