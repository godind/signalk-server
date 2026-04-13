import { isDeltaDataMessage, type Delta, type Update } from './protocol.js'

export function isDelta(value: unknown): value is Delta {
  return isDeltaDataMessage(value)
}

export function getDeltaUpdateCount(delta: Delta): number {
  return delta.updates.length
}

export function hasAnyValues(update: Update): boolean {
  return 'values' in update && Array.isArray(update.values) && update.values.length > 0
}