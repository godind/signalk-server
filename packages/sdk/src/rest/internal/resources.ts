import type {
  ChartResource,
  NoteResource,
  RegionResource,
  RouteResource,
  WaypointResource
} from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface ResourcesApi {
  getRoute(endpoint: EndpointCall): Promise<RouteResource>
  getWaypoint(endpoint: EndpointCall): Promise<WaypointResource>
  getRegion(endpoint: EndpointCall): Promise<RegionResource>
  getNote(endpoint: EndpointCall): Promise<NoteResource>
  getChart(endpoint: EndpointCall): Promise<ChartResource>
}

export function createResourcesApi(transport: RestTransport): ResourcesApi {
  return {
    getRoute(endpoint: EndpointCall): Promise<RouteResource> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<RouteResource>(request)
    },
    getWaypoint(endpoint: EndpointCall): Promise<WaypointResource> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<WaypointResource>(request)
    },
    getRegion(endpoint: EndpointCall): Promise<RegionResource> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<RegionResource>(request)
    },
    getNote(endpoint: EndpointCall): Promise<NoteResource> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<NoteResource>(request)
    },
    getChart(endpoint: EndpointCall): Promise<ChartResource> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<ChartResource>(request)
    }
  }
}
