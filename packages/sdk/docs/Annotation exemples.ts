export const SubscriptionRequestSchema = Type.Object(
  {
    path: Type.Optional(
      Type.String({
        minLength: 1,
        description:
          'Signal K path selector to subscribe to. Omit to subscribe using server defaults.',
        examples: [
          'navigation.speedOverGround',
          'navigation.position',
          'environment.wind.speedApparent'
        ]
      })
    ),

    policy: Type.Optional(
      Type.Union([Type.Literal('fixed'), Type.Literal('instant')], {
        description:
          'Delivery policy for updates: fixed = periodic cadence, instant = on-change delivery.',
        examples: ['fixed', 'instant'],
        default: 'instant'
      })
    ),

    period: Type.Optional(
      Type.Number({
        minimum: 0,
        description:
          'Requested update period in milliseconds when policy is fixed.',
        examples: [1000, 2000],
        default: 1000
      })
    ),

    minPeriod: Type.Optional(
      Type.Number({
        minimum: 0,
        description:
          'Lower bound for update period in milliseconds; server should not emit faster than this.',
        examples: [500, 1000]
      })
    ),

    format: Type.Optional(
      Type.Literal('delta', {
        description:
          'Subscription payload format. SDK currently supports delta only.',
        examples: ['delta'],
        default: 'delta'
      })
    )
  },
  {
    $id: 'SubscriptionRequest',
    additionalProperties: false,
    description:
      'Subscription request options for Signal K protocol-control subscribe messages.',
    examples: [
      {
        path: 'navigation.speedOverGround',
        policy: 'fixed',
        period: 1000,
        format: 'delta'
      },
      {
        path: 'navigation.position',
        policy: 'instant',
        minPeriod: 500,
        format: 'delta'
      }
    ]
  }
)
