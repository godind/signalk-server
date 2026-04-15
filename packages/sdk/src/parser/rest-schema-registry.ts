import type { TSchema } from 'typebox'
import {
  AutopilotInfoSchema,
  AutopilotOptionsSchema,
  AngleInputSchema,
  StringValueInputSchema,
  CourseInfoSchema,
  CourseCalculationsSchema,
  SetDestinationBodySchema,
  ArrivalCircleBodySchema,
  TargetArrivalTimeBodySchema,
  NextPointBodySchema,
  PointIndexBodySchema,
  ReverseBodySchema,
  CourseConfigSchema,
  NotificationResponseSchema,
  RadarInfoSchema,
  RadarControlsSchema,
  RouteSchema,
  WaypointSchema,
  RegionSchema,
  NoteSchema,
  ChartSchema,
  ResourceActionOkResponseSchema,
  ResourceActionCreatedResponseSchema,
  ValuesResponseSchema,
  HistoryProvidersResponseSchema,
  WeatherDataModelSchema,
  WeatherWarningModelSchema,
  DiscoveryDataSchema,
  FeaturesModelSchema
} from '@signalk/server-api/typebox'
import type {
  AutopilotInfoType as AutopilotInfo,
  AngleInput,
  CourseInfoType as CourseInfo,
  CourseCalculationsType as CourseCalculations,
  SetDestinationBodyType as SetDestinationBody,
  ArrivalCircleBodyType as ArrivalCircleBody,
  TargetArrivalTimeBodyType as TargetArrivalTimeBody,
  NextPointBodyType as NextPointBody,
  PointIndexBodyType as PointIndexBody,
  ReverseBodyType as ReverseBody,
  NotificationResponse,
  RadarInfoSchemaType as RadarInfo,
  RadarControlsSchemaType as RadarControlsModel,
  RouteResource as Route,
  WaypointResource as Waypoint,
  RegionResource as Region,
  NoteResource as Note,
  ChartResource as Chart,
  ValuesResponseSchemaType as HistoryValuesResponse,
  HistoryProvidersResponseSchemaType as HistoryProvidersResponse,
  WeatherDataModel,
  WeatherWarningModel,
  DiscoveryData,
  FeaturesModel
} from '@signalk/server-api/typebox'

function defineRestSchemaRegistry<const T extends Record<string, TSchema>>(
  registry: T
): T {
  return registry
}

export const KnownRestPayloadSchemaRegistry = defineRestSchemaRegistry({
  AutopilotInfo: AutopilotInfoSchema as unknown as TSchema,
  AutopilotOptions: AutopilotOptionsSchema as unknown as TSchema,
  AngleInput: AngleInputSchema as unknown as TSchema,
  StringValueInput: StringValueInputSchema as unknown as TSchema,
  CourseInfo: CourseInfoSchema as unknown as TSchema,
  CourseCalculations: CourseCalculationsSchema as unknown as TSchema,
  SetDestinationBody: SetDestinationBodySchema as unknown as TSchema,
  ArrivalCircleBody: ArrivalCircleBodySchema as unknown as TSchema,
  TargetArrivalTimeBody: TargetArrivalTimeBodySchema as unknown as TSchema,
  NextPointBody: NextPointBodySchema as unknown as TSchema,
  PointIndexBody: PointIndexBodySchema as unknown as TSchema,
  ReverseBody: ReverseBodySchema as unknown as TSchema,
  CourseConfig: CourseConfigSchema as unknown as TSchema,
  NotificationResponse: NotificationResponseSchema as unknown as TSchema,
  RadarInfo: RadarInfoSchema as unknown as TSchema,
  RadarControlsModel: RadarControlsSchema as unknown as TSchema,
  Route: RouteSchema as unknown as TSchema,
  Waypoint: WaypointSchema as unknown as TSchema,
  Region: RegionSchema as unknown as TSchema,
  Note: NoteSchema as unknown as TSchema,
  Chart: ChartSchema as unknown as TSchema,
  ResourceActionOkResponse: ResourceActionOkResponseSchema as unknown as TSchema,
  ResourceActionCreatedResponse: ResourceActionCreatedResponseSchema as unknown as TSchema,
  HistoryValuesResponse: ValuesResponseSchema as unknown as TSchema,
  HistoryProvidersResponse: HistoryProvidersResponseSchema as unknown as TSchema,
  WeatherDataModel: WeatherDataModelSchema as unknown as TSchema,
  WeatherWarningModel: WeatherWarningModelSchema as unknown as TSchema,
  DiscoveryData: DiscoveryDataSchema as unknown as TSchema,
  FeaturesModel: FeaturesModelSchema as unknown as TSchema
})

export type RestSchemaName = keyof typeof KnownRestPayloadSchemaRegistry

/**
 * Type map for REST payload schemas.
 *
 * Uses server-api exported Static types where available.
 * Inline types for schemas without explicit type exports.
 *
 * Enforce completeness: KnownRestPayloadTypeMap must cover all RestSchemaName keys.
 */
export type KnownRestPayloadTypeMap = {
  [K in RestSchemaName]: K extends 'AutopilotInfo'
    ? AutopilotInfo
    : K extends 'AutopilotOptions'
      ? AutopilotInfo['options']
      : K extends 'AngleInput'
        ? AngleInput
        : K extends 'StringValueInput'
          ? { value: string }
          : K extends 'CourseInfo'
            ? CourseInfo
            : K extends 'CourseCalculations'
              ? CourseCalculations
              : K extends 'SetDestinationBody'
                ? SetDestinationBody
                : K extends 'ArrivalCircleBody'
                  ? ArrivalCircleBody
                  : K extends 'TargetArrivalTimeBody'
                    ? TargetArrivalTimeBody
                    : K extends 'NextPointBody'
                      ? NextPointBody
                      : K extends 'PointIndexBody'
                        ? PointIndexBody
                        : K extends 'ReverseBody'
                          ? ReverseBody
                          : K extends 'CourseConfig'
                            ? { apiOnly: boolean }
                            : K extends 'NotificationResponse'
                              ? NotificationResponse
                              : K extends 'RadarInfo'
                                ? RadarInfo
                                : K extends 'RadarControlsModel'
                                  ? RadarControlsModel
                                  : K extends 'Route'
                                    ? Route
                                    : K extends 'Waypoint'
                                      ? Waypoint
                                      : K extends 'Region'
                                        ? Region
                                        : K extends 'Note'
                                          ? Note
                                          : K extends 'Chart'
                                            ? Chart
                                            : K extends 'ResourceActionOkResponse'
                                              ? { state: 'COMPLETED'; statusCode: 200; id: string }
                                              : K extends 'ResourceActionCreatedResponse'
                                                ? { state: 'COMPLETED'; statusCode: 201; id: string }
                                                : K extends 'HistoryValuesResponse'
                                                  ? HistoryValuesResponse
                                                  : K extends 'HistoryProvidersResponse'
                                                    ? HistoryProvidersResponse
                                                    : K extends 'WeatherDataModel'
                                                      ? WeatherDataModel
                                                      : K extends 'WeatherWarningModel'
                                                        ? WeatherWarningModel
                                                        : K extends 'DiscoveryData'
                                                          ? DiscoveryData
                                                          : K extends 'FeaturesModel'
                                                            ? FeaturesModel
                                                            : never
}
