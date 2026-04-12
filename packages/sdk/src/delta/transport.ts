import Type from 'typebox'
import { Value } from 'typebox/value'

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

const SourceSchema = Type.Object({
  label: Type.String(),
  type: Type.Optional(Type.String()),
  src: Type.Optional(Type.String()),
  canName: Type.Optional(Type.String()),
  pgn: Type.Optional(Type.Number()),
  instance: Type.Optional(Type.String()),
  sentence: Type.Optional(Type.String()),
  talker: Type.Optional(Type.String()),
  aisType: Type.Optional(Type.Integer({ minimum: 1, maximum: 27 }))
})

const UpdateBaseSchema = Type.Object({
  timestamp: Type.Optional(Type.String()),
  source: Type.Optional(SourceSchema),
  $source: Type.Optional(Type.String({ pattern: '^[A-Za-z0-9-_.]*$' })),
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
export type Update = DeltaData['updates'][number]

const RelativePositionOriginSchema = Type.Object(
  {
    radius: Type.Number({ minimum: 0 }),
    position: Type.Object({
      latitude: Type.Number(),
      longitude: Type.Number(),
      altitude: Type.Optional(Type.Number())
    })
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
    policy: Type.Optional(Type.Union([Type.Literal('fixed'), Type.Literal('instant')])),
    period: Type.Optional(Type.Number()),
    minPeriod: Type.Optional(Type.Number()),
    format: Type.Optional(Type.Literal('delta'))
  },
  { additionalProperties: false }
)

export const RelaxedSubscriptionRequestSchema = Type.Object(
  {
    path: Type.Optional(Type.String()),
    policy: Type.Optional(Type.Union([Type.Literal('fixed'), Type.Literal('instant')])),
    period: Type.Optional(Type.Number()),
    minPeriod: Type.Optional(Type.Number()),
    format: Type.Optional(Type.String())
  },
  { additionalProperties: false }
)

export const ProtocolSubscribeMessageSchema = Type.Object(
  {
    context: Type.Union([Type.String(), RelativePositionOriginSchema]),
    subscribe: Type.Array(SubscriptionRequestSchema),
    announceNewPaths: Type.Optional(Type.Boolean())
  },
  { additionalProperties: false }
)

export const RelaxedProtocolSubscribeMessageSchema = Type.Object(
  {
    context: Type.Union([Type.String(), RelativePositionOriginSchema]),
    subscribe: Type.Array(RelaxedSubscriptionRequestSchema),
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

export const RelaxedProtocolControlMessageSchema = Type.Union([
  ProtocolHelloMessageSchema,
  RelaxedProtocolSubscribeMessageSchema,
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

export function isDeltaDataMessage(value: unknown): value is DeltaData {
  return Value.Check(DeltaDataSchema, value)
}

export function isProtocolHelloMessage(value: unknown): value is ProtocolHelloMessage {
  return Value.Check(ProtocolHelloMessageSchema, value)
}

export function isProtocolSubscribeMessage(
  value: unknown,
  formatValidation = true
): value is ProtocolSubscribeMessage {
  return formatValidation
    ? Value.Check(ProtocolSubscribeMessageSchema, value)
    : Value.Check(RelaxedProtocolSubscribeMessageSchema, value)
}

export function isProtocolUnsubscribeMessage(
  value: unknown
): value is ProtocolUnsubscribeMessage {
  return Value.Check(ProtocolUnsubscribeMessageSchema, value)
}

export function isProtocolAckMessage(value: unknown): value is ProtocolAckMessage {
  return Value.Check(ProtocolAckMessageSchema, value)
}

export function isProtocolErrorMessage(value: unknown): value is ProtocolErrorMessage {
  return Value.Check(ProtocolErrorMessageSchema, value)
}

export function isProtocolControlMessage(
  value: unknown,
  formatValidation = true
): value is ProtocolControlMessage {
  return formatValidation
    ? Value.Check(ProtocolControlMessageSchema, value)
    : Value.Check(RelaxedProtocolControlMessageSchema, value)
}
