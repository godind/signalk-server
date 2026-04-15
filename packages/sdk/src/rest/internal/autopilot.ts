import type { AngleInput, AutopilotInfoType } from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface AutopilotApi {
  getInfo(endpoint: EndpointCall): Promise<AutopilotInfoType>
  setTargetAngle(endpoint: EndpointCall, body: AngleInput): Promise<AutopilotInfoType>
}

export function createAutopilotApi(transport: RestTransport): AutopilotApi {
  return {
    getInfo(endpoint: EndpointCall): Promise<AutopilotInfoType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<AutopilotInfoType>(request)
    },
    setTargetAngle(endpoint: EndpointCall, body: AngleInput): Promise<AutopilotInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<AutopilotInfoType, AngleInput>({
        ...request,
        body
      })
    }
  }
}
