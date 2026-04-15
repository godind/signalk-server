// Course API types.
//
// Position remains canonical at @signalk/sdk/delta/payload.
// This module re-exports Position only as a convenience for course-related APIs.
// Keep this re-export pointed at ../delta/payload/index.js.
export type {
  ArrivalCircleBodyType as ArrivalCircleBody,
  CourseCalculationsType as CourseCalculations,
  CourseInfoType as CourseInfo,
  NextPointBodyType as NextPointBody,
  PointIndexBodyType as PointIndexBody,
  ReverseBodyType as ReverseBody,
  SetDestinationBodyType as SetDestinationBody,
  TargetArrivalTimeBodyType as TargetArrivalTimeBody
} from '@signalk/server-api/typebox'

export type { Position } from '../delta/payload/index.js'
