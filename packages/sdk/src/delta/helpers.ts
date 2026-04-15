import { Value } from 'typebox/value'
import type { Delta, Update } from './delta.js'
import { DeltaData, DeltaDataSchema, ProtocolAckMessage, ProtocolAckMessageSchema, ProtocolControlMessage, ProtocolControlMessageSchema, ProtocolErrorMessage, ProtocolErrorMessageSchema, ProtocolHelloMessage, ProtocolHelloMessageSchema, ProtocolSubscribeMessage, ProtocolSubscribeMessageSchema, ProtocolUnsubscribeMessage, ProtocolUnsubscribeMessageSchema } from './index.js'

// Delta helper functions for working with Delta objects and transport messages.
export function isDelta(value: unknown): value is Delta {
  return isDeltaDataMessage(value)
}

export function getDeltaUpdateCount(delta: Delta): number {
  return delta.updates.length
}

export function hasAnyValues(update: Update): boolean {
  return 'values' in update && Array.isArray(update.values) && update.values.length > 0
}

// Transport message type guards for classifying incoming WS messages as Delta or Protocol Control messages.
export function isDeltaDataMessage(value: unknown): value is DeltaData {
  return Value.Check(DeltaDataSchema, value)
}

export function isProtocolHelloMessage(value: unknown): value is ProtocolHelloMessage {
  return Value.Check(ProtocolHelloMessageSchema, value)
}

export function isProtocolSubscribeMessage(
  value: unknown,
  _formatValidation = true
): value is ProtocolSubscribeMessage {
  return Value.Check(ProtocolSubscribeMessageSchema, value)
}

export function isProtocolUnsubscribeMessage(
  value: unknown
): value is ProtocolUnsubscribeMessage {
  return Value.Check(ProtocolUnsubscribeMessageSchema, value)
}

export function isProtocolAckMessage(value: unknown): value is ProtocolAckMessage {
  return Value.Check(ProtocolAckMessageSchema, value)
}

export function isProtocolErrorMessage(value: unknown): value is ProtocolErrorMessage {
  return Value.Check(ProtocolErrorMessageSchema, value)
}

export function isProtocolControlMessage(
  value: unknown,
  _formatValidation = true
): value is ProtocolControlMessage {
  return Value.Check(ProtocolControlMessageSchema, value)
}
