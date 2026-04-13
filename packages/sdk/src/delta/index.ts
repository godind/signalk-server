export {
  isDeltaDataMessage,
  isProtocolControlMessage
} from './protocol.js'

export type {
  Delta,
  Update,
  TransportMessage,
  ProtocolControlMessage,
  TransportScope
} from './protocol.js'

export { isDelta, getDeltaUpdateCount, hasAnyValues } from './helpers.js'