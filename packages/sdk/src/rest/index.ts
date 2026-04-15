import type { Delta } from '../delta/index.js'
import {
  createAutopilotApi,
  type AutopilotApi
} from './internal/autopilot.js'
import {
  createCourseApi,
  type CourseApi
} from './internal/course.js'
import {
  createDiscoveryApi,
  type DiscoveryApi
} from './internal/discovery.js'
import {
  createHistoryApi,
  type HistoryApi
} from './internal/history.js'
import {
  createNotificationsApi,
  type NotificationsApi
} from './internal/notifications.js'
import {
  createRadarApi,
  type RadarApi
} from './internal/radar.js'
import {
  createResourcesApi,
  type ResourcesApi
} from './internal/resources.js'
import {
  createWeatherApi,
  type WeatherApi
} from './internal/weather.js'
import type { EndpointCall, RestRequest } from './transport.js'
import type { RestTransport } from './internal/transport.js'

export interface FetchResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface FetchRequestInitLike {
  method?: string
  headers?: Record<string, string>
  body?: string
}

export type FetchLike = (
  input: string,
  init?: FetchRequestInitLike
) => Promise<FetchResponseLike>

const EMPTY_JSON_PARSE_ERROR_PATTERNS = [
  'unexpected end of json input',
  'unexpected end of data',
  'unexpected eof'
]

function isNoBodyJsonParseError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) {
    return false
  }

  const normalizedMessage = error.message.toLowerCase()
  return EMPTY_JSON_PARSE_ERROR_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern)
  )
}

function hasHeaderCaseInsensitive(
  headers: Record<string, string>,
  headerName: string
): boolean {
  const normalizedHeaderName = headerName.toLowerCase()
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === normalizedHeaderName
  )
}

type GlobalWithOptionalFetch = {
  fetch?: FetchLike
}

export interface SignalKRestClientOptions {
  baseUrl: string
  fetchImpl?: FetchLike
}

export class SignalKRestClient implements RestTransport {
  private readonly baseUrl: string
  private readonly fetchImpl: FetchLike

  readonly discovery: DiscoveryApi
  readonly history: HistoryApi
  readonly course: CourseApi
  readonly autopilot: AutopilotApi
  readonly radar: RadarApi
  readonly resources: ResourcesApi
  readonly notifications: NotificationsApi
  readonly weather: WeatherApi

  constructor(options: SignalKRestClientOptions) {
    const defaultFetch = (globalThis as GlobalWithOptionalFetch).fetch

    if (!options.fetchImpl && !defaultFetch) {
      throw new Error(
        'No fetch implementation available. Provide fetchImpl in SignalKRestClientOptions.'
      )
    }

    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.fetchImpl = options.fetchImpl ?? defaultFetch!

    this.discovery = createDiscoveryApi(this)
    this.history = createHistoryApi(this)
    this.course = createCourseApi(this)
    this.autopilot = createAutopilotApi(this)
    this.radar = createRadarApi(this)
    this.resources = createResourcesApi(this)
    this.notifications = createNotificationsApi(this)
    this.weather = createWeatherApi(this)
  }

  async request<TResponse, TBody = unknown>(
    request: RestRequest<TBody>
  ): Promise<TResponse> {
    const response = await this.send(request)

    try {
      return (await response.json()) as TResponse
    } catch (error) {
      if (isNoBodyJsonParseError(error)) {
        return undefined as TResponse
      }

      throw error
    }
  }

  async requestNoContent<TBody = unknown>(
    request: RestRequest<TBody>
  ): Promise<void> {
    const response = await this.send(request)
    if (response.status !== 204) {
      throw new Error(`Expected 204 No Content, got ${response.status}`)
    }
  }

  private async send<TBody = unknown>(
    request: RestRequest<TBody>
  ): Promise<FetchResponseLike> {
    const headers: Record<string, string> = {
      ...(request.headers ?? {})
    }

    let body: string | undefined
    if (request.body !== undefined) {
      body = JSON.stringify(request.body)
      if (!hasHeaderCaseInsensitive(headers, 'Content-Type')) {
        headers['Content-Type'] = 'application/json'
      }
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/${request.path.replace(/^\//, '')}`,
      {
        method: request.method,
        headers,
        body
      }
    )

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return response
  }

  async getSelfDelta(endpoint: EndpointCall): Promise<Delta> {
    return this.request<Delta>({
      method: endpoint.method ?? 'GET',
      path: endpoint.path
    })
  }
}
