import { isDeltaDataMessage, type Delta } from '../delta/transport.js'

export interface SignalKRestClientOptions {
  baseUrl: string
  fetchImpl?: typeof fetch
}

export class SignalKRestClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: SignalKRestClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async get(path: string): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl}/${path.replace(/^\//, '')}`)
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return response.json()
  }

  async getSelfDelta(): Promise<Delta> {
    const result = await this.get('signalk/v1/api/vessels/self')
    if (!isDeltaDataMessage(result)) {
      throw new Error('Response is not a valid Signal K delta object')
    }

    return result
  }
}
