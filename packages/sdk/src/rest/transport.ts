export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface EndpointCall {
  path: string
  method?: HttpMethod
}

export interface RestRequest<TBody = unknown> {
  method: HttpMethod
  path: string
  body?: TBody
  headers?: Record<string, string>
}

export function resolveEndpoint(
  endpoint: EndpointCall,
  defaultMethod: HttpMethod
): { method: HttpMethod; path: string } {
  return {
    method: endpoint.method ?? defaultMethod,
    path: endpoint.path
  }
}
