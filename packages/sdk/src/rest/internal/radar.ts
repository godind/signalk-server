import type {
  RadarControlsSchemaType,
  RadarInfoSchemaType
} from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface RadarApi {
  getInfo(endpoint: EndpointCall): Promise<RadarInfoSchemaType>
  getControls(endpoint: EndpointCall): Promise<RadarControlsSchemaType>
  setControls(
    endpoint: EndpointCall,
    body: RadarControlsSchemaType
  ): Promise<RadarControlsSchemaType>
}

export function createRadarApi(transport: RestTransport): RadarApi {
  return {
    getInfo(endpoint: EndpointCall): Promise<RadarInfoSchemaType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<RadarInfoSchemaType>(request)
    },
    getControls(endpoint: EndpointCall): Promise<RadarControlsSchemaType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<RadarControlsSchemaType>(request)
    },
    setControls(
      endpoint: EndpointCall,
      body: RadarControlsSchemaType
    ): Promise<RadarControlsSchemaType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<RadarControlsSchemaType, RadarControlsSchemaType>(
        {
          ...request,
          body
        }
      )
    }
  }
}
