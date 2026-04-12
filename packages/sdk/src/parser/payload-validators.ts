import { Compile, type Validator } from 'typebox/compile'
import type { TSchema } from 'typebox'
import { MetaSchema } from '@signalk/server-api/typebox'
import {
  KnownValueSchemaRegistry,
  type SignalKSchemaName
} from './schema-type-registry.js'

export type CompiledPayloadValidators = Record<SignalKSchemaName, Validator>

export function createCompiledPayloadValidators(): CompiledPayloadValidators {
  const compiled = {} as CompiledPayloadValidators

  for (const schemaName of Object.keys(KnownValueSchemaRegistry) as SignalKSchemaName[]) {
    compiled[schemaName] = Compile(KnownValueSchemaRegistry[schemaName])
  }

  return compiled
}

export function createCompiledMetadataValidator(): Validator {
  return Compile(MetaSchema as unknown as TSchema)
}
