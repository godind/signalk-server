import { type MetaValue } from '@signalk/server-api/typebox'

export type MetadataValidationStatus = 'valid' | 'invalid'

export type MetadataValuePayload = MetaValue

export interface MetadataValidationError {
  path: string
  message: string
}

export interface NormalizedDeltaMetadataBase {
  context: string
  $source: string
  source?: unknown
  path: string
  timestamp?: string
}

export type ValidatedMetadata = NormalizedDeltaMetadataBase & {
  value: MetadataValuePayload
  validationStatus: 'valid'
}

export type InvalidMetadata = NormalizedDeltaMetadataBase & {
  rawPath?: unknown
  value: unknown
  validationStatus: 'invalid'
  validationErrors: MetadataValidationError[]
}

export type ParsedMetadata = ValidatedMetadata | InvalidMetadata
