import { Compile, type Validator } from 'typebox/compile'
import type { TSchema } from 'typebox'
import { MetaSchema, PositionSchema } from '@signalk/server-api/typebox'
import {
  KnownValueSchemaRegistry,
  type SignalKSchemaName
} from './schema-type-registry.js'

export type CompiledPayloadValidators = Record<SignalKSchemaName, Validator>

/**
 * Extract the $id from a TypeBox schema with a guard that fails fast if missing.
 * This prevents silent validation failures if upstream schemas lose their $id.
 */
function getSchemaId(schema: unknown): string {
  const id = (schema as Record<string, unknown>)['$id']
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(
      `Schema is missing $id — cannot register for payload validator context`
    )
  }
  return id
}

/**
 * Centralized map of all schemas that payload value schemas might reference via Type.Ref.
 * This map is passed to TypeBox's Compile() function to resolve $ref pointers.
 *
 * When adding new payload value schemas (e.g., from server-api), ensure any schemas
 * they reference via Type.Ref are included here. A regression test validates that
 * all refs in the registry fully validate without errors.
 */
const payloadSchemaReferences: Record<string, TSchema> = {
  [getSchemaId(PositionSchema)]: PositionSchema as unknown as TSchema
  // Add new referenced schemas here as payload registry grows.
  // Example: [getSchemaId(SomeNewSchema)]: SomeNewSchema as unknown as TSchema
}

export function createCompiledPayloadValidators(): CompiledPayloadValidators {
  const compiled = {} as CompiledPayloadValidators

  for (const schemaName of Object.keys(KnownValueSchemaRegistry) as SignalKSchemaName[]) {
    compiled[schemaName] = Compile(
      payloadSchemaReferences,
      KnownValueSchemaRegistry[schemaName]
    )
  }

  return compiled
}

export function createCompiledMetadataValidator(): Validator {
  return Compile(MetaSchema as unknown as TSchema)
}
