import { Compile, type Validator } from 'typebox/compile'
import type { TSchema } from 'typebox'
import { RadarControlValueSchema } from '@signalk/server-api/typebox'
import {
  KnownRestPayloadSchemaRegistry,
  type RestSchemaName
} from './rest-schema-registry.js'

export type CompiledRestPayloadValidators = Record<RestSchemaName, Validator>

function getSchemaId(schema: unknown): string {
  const id = (schema as Record<string, unknown>)['$id']
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(
      `Schema is missing $id — cannot register for REST payload validator context`
    )
  }
  return id
}

/**
 * Reference schemas needed for Type.Ref resolution within REST payload schemas.
 * RadarControlValueSchema is referenced via Type.Ref inside RadarControlsSchema.
 */
const restSchemaReferences: Record<string, TSchema> = {
  [getSchemaId(RadarControlValueSchema)]: RadarControlValueSchema as unknown as TSchema
}

function createCompiledRestPayloadValidators(): CompiledRestPayloadValidators {
  const compiled = {} as CompiledRestPayloadValidators

  for (const schemaName of Object.keys(KnownRestPayloadSchemaRegistry) as RestSchemaName[]) {
    compiled[schemaName] = Compile(
      restSchemaReferences,
      KnownRestPayloadSchemaRegistry[schemaName]
    )
  }

  return compiled
}

export const compiledRestPayloadValidators = createCompiledRestPayloadValidators()
