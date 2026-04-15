import type {
  ArrivalCircleBodyType,
  CourseCalculationsType,
  CourseInfoType,
  NextPointBodyType,
  PointIndexBodyType,
  ReverseBodyType,
  SetDestinationBodyType,
  TargetArrivalTimeBodyType
} from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface CourseApi {
  getInfo(endpoint: EndpointCall): Promise<CourseInfoType>
  getCalculations(endpoint: EndpointCall): Promise<CourseCalculationsType>
  setDestination(endpoint: EndpointCall, body: SetDestinationBodyType): Promise<CourseInfoType>
  setArrivalCircle(endpoint: EndpointCall, body: ArrivalCircleBodyType): Promise<CourseInfoType>
  setTargetArrivalTime(
    endpoint: EndpointCall,
    body: TargetArrivalTimeBodyType
  ): Promise<CourseInfoType>
  goToNextPoint(endpoint: EndpointCall, body: NextPointBodyType): Promise<CourseInfoType>
  setPointIndex(endpoint: EndpointCall, body: PointIndexBodyType): Promise<CourseInfoType>
  reverse(endpoint: EndpointCall, body: ReverseBodyType): Promise<CourseInfoType>
}

export function createCourseApi(transport: RestTransport): CourseApi {
  return {
    getInfo(endpoint: EndpointCall): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<CourseInfoType>(request)
    },
    getCalculations(endpoint: EndpointCall): Promise<CourseCalculationsType> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<CourseCalculationsType>(request)
    },
    setDestination(endpoint: EndpointCall, body: SetDestinationBodyType): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, SetDestinationBodyType>({
        ...request,
        body
      })
    },
    setArrivalCircle(endpoint: EndpointCall, body: ArrivalCircleBodyType): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, ArrivalCircleBodyType>({
        ...request,
        body
      })
    },
    setTargetArrivalTime(
      endpoint: EndpointCall,
      body: TargetArrivalTimeBodyType
    ): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, TargetArrivalTimeBodyType>({
        ...request,
        body
      })
    },
    goToNextPoint(endpoint: EndpointCall, body: NextPointBodyType): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, NextPointBodyType>({
        ...request,
        body
      })
    },
    setPointIndex(endpoint: EndpointCall, body: PointIndexBodyType): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, PointIndexBodyType>({
        ...request,
        body
      })
    },
    reverse(endpoint: EndpointCall, body: ReverseBodyType): Promise<CourseInfoType> {
      const request = resolveEndpoint(endpoint, 'PUT')
      return transport.request<CourseInfoType, ReverseBodyType>({
        ...request,
        body
      })
    }
  }
}
