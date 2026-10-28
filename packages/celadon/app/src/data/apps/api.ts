import { serviceUrl, transport } from '@/platform/transport'
import type { AppRecord, BotRecord } from './types'

export class AppsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'AppsApiError'
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await transport.fetchOk(serviceUrl(path), {
    headers: { 'content-type': 'application/json' },
  })
  if (!response.ok) {
    throw new AppsApiError('The app catalog is unavailable.')
  }
  if (!response.value.ok) {
    throw new AppsApiError('The app catalog returned an error.', response.value.status)
  }
  return (await response.value.json()) as T
}

export async function listApps(): Promise<AppRecord[]> {
  const body = await request<{ data: AppRecord[] }>('/v1/apps')
  return body.data
}

export async function getApp(id: string): Promise<AppRecord> {
  const body = await request<{ app: AppRecord }>(`/v1/apps/${encodeURIComponent(id)}`)
  return body.app
}

export async function listBots(): Promise<BotRecord[]> {
  const body = await request<{ data: BotRecord[] }>('/v1/bots')
  return body.data
}
