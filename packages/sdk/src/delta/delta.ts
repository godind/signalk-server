// Delta entrypoint exports transport-layer types and guards.
//
// These types intentionally remain SDK-local and are not re-exported from
// @signalk/server-api payload/domain schemas.
export {
  isDeltaDataMessage,
  isProtocolControlMessage,
  isDelta,
  getDeltaUpdateCount,
  hasAnyValues
} from './helpers.js'

export type {
  Delta,
  Meta,
  PathValue,
  Update,
  TransportMessage,
  ProtocolControlMessage,
  TransportScope
} from './index.js'
