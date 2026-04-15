import type { NotificationResponse } from '@signalk/server-api/typebox'
import type { EndpointCall } from '../transport.js'
import { resolveEndpoint } from '../transport.js'
import type { RestTransport } from './transport.js'

export interface NotificationsApi {
  getNotifications(endpoint: EndpointCall): Promise<NotificationResponse>
}

export function createNotificationsApi(
  transport: RestTransport
): NotificationsApi {
  return {
    getNotifications(endpoint: EndpointCall): Promise<NotificationResponse> {
      const request = resolveEndpoint(endpoint, 'GET')
      return transport.request<NotificationResponse>(request)
    }
  }
}
