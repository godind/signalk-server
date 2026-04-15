import type { DiscoveryData, FeaturesModel } from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface DiscoveryApi {
  getDiscoveryData(endpoint: EndpointCall): Promise<DiscoveryData>
  getFeatures(endpoint: EndpointCall): Promise<FeaturesModel>
}

export function createDiscoveryApi(transport: RestTransport): DiscoveryApi {
  return {
    getDiscoveryData(endpoint: EndpointCall): Promise<DiscoveryData> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<DiscoveryData>(request)
    },
    getFeatures(endpoint: EndpointCall): Promise<FeaturesModel> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<FeaturesModel>(request)
    }
  }
}
