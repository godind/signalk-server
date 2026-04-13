import type { MetadataValue } from '../delta/metadata/index.js'

export type { MetadataValue } from '../delta/metadata/index.js'

export type MetadataValidationStatus = 'valid' | 'invalid'

export interface MetadataValidationError {
  path: string
  message: string
}

export interface MetadataBase {
  context: string
  $source: string
  source?: unknown
  path: string
  timestamp?: string
}

export type ValidMetadata = MetadataBase & {
  value: MetadataValue
  validationStatus: 'valid'
}

export type InvalidMetadata = MetadataBase & {
  rawPath?: unknown
  value: unknown
  validationStatus: 'invalid'
  validationErrors: MetadataValidationError[]
}

export type Metadata = ValidMetadata | InvalidMetadata