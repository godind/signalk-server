import * as transport from './transport.js'
import type { Delta, Update } from './transport.js'

export type { Delta, Update }

export function isDelta(value: unknown): value is Delta {
  return transport.isDeltaDataMessage(value)
}

export function getDeltaUpdateCount(delta: Delta): number {
  return delta.updates.length
}

export function hasAnyValues(update: Update): boolean {
  return 'values' in update && Array.isArray(update.values) && update.values.length > 0
}
