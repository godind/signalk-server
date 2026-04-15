import type {
  HistoryProvidersResponseSchemaType,
  ValuesResponseSchemaType
} from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface HistoryApi {
  getProviders(endpoint: EndpointCall): Promise<HistoryProvidersResponseSchemaType>
  getValues(endpoint: EndpointCall): Promise<ValuesResponseSchemaType>
}

export function createHistoryApi(transport: RestTransport): HistoryApi {
  return {
    getProviders(endpoint: EndpointCall): Promise<HistoryProvidersResponseSchemaType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<HistoryProvidersResponseSchemaType>(request)
    },
    getValues(endpoint: EndpointCall): Promise<ValuesResponseSchemaType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<ValuesResponseSchemaType>(request)
    }
  }
}
