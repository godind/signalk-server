import Type, { type TSchema } from 'typebox'
import { PositionSchema } from '@signalk/server-api/typebox'

export type TransportScope = 'delta-data' | 'protocol-control' | 'all'

const PathValueSchema = Type.Object(
  {
    path: Type.String(),
    value: Type.Unknown()
  },
  { additionalProperties: false }
)

const MetaSchema = Type.Object(
  {
    path: Type.String(),
    value: Type.Unknown()
  },
  { additionalProperties: false }
)

const UpdateBaseSchema = Type.Object({
  timestamp: Type.Optional(Type.String()),
  $source: Type.Optional(Type.String()),
  notificationId: Type.Optional(Type.String())
})

const UpdateWithValuesSchema = Type.Intersect([
  UpdateBaseSchema,
  Type.Object({
    values: Type.Array(PathValueSchema),
    meta: Type.Optional(Type.Array(MetaSchema))
  })
])

const UpdateWithMetaSchema = Type.Intersect([
  UpdateBaseSchema,
  Type.Object({
    meta: Type.Array(MetaSchema),
    values: Type.Optional(Type.Array(PathValueSchema))
  })
])

const UpdateSchema = Type.Union([UpdateWithValuesSchema, UpdateWithMetaSchema])

export const DeltaDataSchema = Type.Object(
  {
    context: Type.Optional(Type.String()),
    updates: Type.Array(UpdateSchema)
  },
  { additionalProperties: false }
)

export type DeltaData = Type.Static<typeof DeltaDataSchema>
export type Delta = DeltaData
export type PathValue = Type.Static<typeof PathValueSchema>
export type Meta = Type.Static<typeof MetaSchema>
export type Update = DeltaData['updates'][number]

const RelativePositionOriginSchema = Type.Object(
  {
    radius: Type.Number({ minimum: 0 }),
    position: PositionSchema as unknown as TSchema
  },
  { additionalProperties: false }
)

const RoleMasterSchema = Type.Tuple([
  Type.Literal('master'),
  Type.Union([Type.Literal('main'), Type.Literal('aux')])
])
const RoleSlaveSchema = Type.Tuple([Type.Literal('slave')])

export const ProtocolHelloMessageSchema = Type.Object(
  {
    name: Type.Optional(Type.String()),
    playbackRate: Type.Optional(Type.Number()),
    roles: Type.Optional(Type.Union([RoleMasterSchema, RoleSlaveSchema])),
    self: Type.Optional(Type.String()),
    startTime: Type.Optional(Type.String()),
    timestamp: Type.Optional(Type.String()),
    version: Type.Optional(Type.String())
  },
  { additionalProperties: false }
)

export const SubscriptionRequestSchema = Type.Object(
  {
    path: Type.Optional(Type.String()),
    policy: Type.Optional(Type.Literal('fixed')),
    period: Type.Optional(Type.Number()),
    format: Type.Optional(Type.Literal('delta'))
  },
  {
    additionalProperties: false,
    allOf: [
      {
        not: {
          required: ['minPeriod']
        }
      }
    ]
  }
)

const InstantSubscriptionRequestSchema = Type.Object(
  {
    path: Type.Optional(Type.String()),
    policy: Type.Optional(Type.Literal('instant')),
    minPeriod: Type.Optional(Type.Number()),
    format: Type.Optional(Type.Literal('delta'))
  },
  {
    additionalProperties: false,
    allOf: [
      {
        not: {
          required: ['period']
        }
      }
    ]
  }
)

const SubscriptionRequestUnionSchema = Type.Union([
  SubscriptionRequestSchema,
  InstantSubscriptionRequestSchema
])

export const ProtocolSubscribeMessageSchema = Type.Object(
  {
    context: Type.Union([Type.String(), RelativePositionOriginSchema]),
    subscribe: Type.Array(SubscriptionRequestUnionSchema),
    announceNewPaths: Type.Optional(Type.Boolean())
  },
  { additionalProperties: false }
)

export const ProtocolUnsubscribeMessageSchema = Type.Object(
  {
    context: Type.Literal('*'),
    unsubscribe: Type.Tuple([
      Type.Object(
        {
          path: Type.Literal('*')
        },
        { additionalProperties: false }
      )
    ])
  },
  { additionalProperties: false }
)

export const ProtocolAckMessageSchema = Type.Object(
  {
    type: Type.Literal('ack'),
    requestId: Type.Optional(Type.String())
  },
  { additionalProperties: false }
)

export const ProtocolErrorMessageSchema = Type.Object(
  {
    type: Type.Literal('error'),
    requestId: Type.Optional(Type.String()),
    message: Type.String()
  },
  { additionalProperties: false }
)

export const ProtocolControlMessageSchema = Type.Union([
  ProtocolHelloMessageSchema,
  ProtocolSubscribeMessageSchema,
  ProtocolUnsubscribeMessageSchema,
  ProtocolAckMessageSchema,
  ProtocolErrorMessageSchema
])

export type ProtocolHelloMessage = Type.Static<typeof ProtocolHelloMessageSchema>
export type SubscriptionRequest = Type.Static<typeof SubscriptionRequestSchema>
export type ProtocolSubscribeMessage = Type.Static<typeof ProtocolSubscribeMessageSchema>
export type ProtocolUnsubscribeMessage = Type.Static<typeof ProtocolUnsubscribeMessageSchema>
export type ProtocolAckMessage = Type.Static<typeof ProtocolAckMessageSchema>
export type ProtocolErrorMessage = Type.Static<typeof ProtocolErrorMessageSchema>
export type ProtocolControlMessage = Type.Static<typeof ProtocolControlMessageSchema>

export type TransportMessage = DeltaData | ProtocolControlMessage
