import type { WeatherDataModel, WeatherWarningModel } from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface WeatherApi {
  getData(endpoint: EndpointCall): Promise<WeatherDataModel>
  getWarnings(endpoint: EndpointCall): Promise<WeatherWarningModel[]>
}

export function createWeatherApi(transport: RestTransport): WeatherApi {
  return {
    getData(endpoint: EndpointCall): Promise<WeatherDataModel> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<WeatherDataModel>(request)
    },
    getWarnings(endpoint: EndpointCall): Promise<WeatherWarningModel[]> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<WeatherWarningModel[]>(request)
    }
  }
}
