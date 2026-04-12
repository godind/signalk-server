import Type, { type TSchema } from 'typebox'
import {
  NotificationSchema,
  PositionSchema
} from '@signalk/server-api/typebox'

/**
 * Schema-type registry for payload parsing.
 *
 * Extension guide (single source of truth):
 * 1. Define a new `*DeltaValueSchema` in this file.
 * 2. Add one entry to `KnownValueSchemaRegistry` where:
 *    - key = incoming `meta.type` string
 *    - value = matching TypeBox schema for the normalized delta payload
 *
 * Automation provided by this module:
 * - `SignalKSchemaName` is auto-derived from registry keys.
 * - `KnownValueTypeMap` is auto-derived from registry schemas via `Type.Static`.
 * - `ValidatedValue` and `InvalidValue` unions are auto-derived from
 *   `SignalKSchemaName` and `KnownValueTypeMap`.
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

export const KnownValueSchemaRegistry = defineSchemaTypeRegistry({
  Numeric: NumericDeltaValueSchema,
  Position: PositionDeltaValueSchema,
  Notification: NotificationDeltaValueSchema
})

export type SignalKSchemaName = keyof typeof KnownValueSchemaRegistry

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

export type KnownValueTypeMap = {
  [K in SignalKSchemaName]: Type.Static<(typeof KnownValueSchemaRegistry)[K]>
}

export type NumericDeltaValue = KnownValueTypeMap['Numeric']
export type PositionDeltaValue = KnownValueTypeMap['Position']
export type NotificationDeltaValue = KnownValueTypeMap['Notification']

type KnownSchemaTag<K extends SignalKSchemaName> = {
  schemaName: K
  valueType: K
  schemaTypeStatus: 'known-schema-type'
}

type KnownSchemaValidated<K extends SignalKSchemaName> = KnownValueTypeMap[K] &
  KnownSchemaTag<K> & {
    validationStatus: 'valid'
  }

type KnownSchemaInvalid<K extends SignalKSchemaName> = NormalizedDeltaValueBase &
  KnownSchemaTag<K> & {
    value: unknown
    validationStatus: 'invalid'
    validationErrors: ValidationError[]
  }

export type ValidatedValue = {
  [K in SignalKSchemaName]: KnownSchemaValidated<K>
}[SignalKSchemaName]

export type InvalidValue = {
  [K in SignalKSchemaName]: KnownSchemaInvalid<K>
}[SignalKSchemaName]

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
