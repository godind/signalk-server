import type { RestRequest } from '../transport.js'

export interface RestTransport {
  request<TResponse, TBody = unknown>(request: RestRequest<TBody>): Promise<TResponse>
  requestNoContent<TBody = unknown>(request: RestRequest<TBody>): Promise<void>
}
