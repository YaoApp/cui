import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetchOk: vi.fn() }))

import { transportFetchOk } from '@/platform/transport/fetch'
import { loadCloudServers, portalBase, shapeCloudServers } from './portal'

const ok = (body: unknown) =>
  ({ ok: true as const, value: new Response(JSON.stringify(body), { status: 200 }) })

describe('the cloud portal', () => {
  beforeEach(() => {
    vi.mocked(transportFetchOk).mockReset()
  })

  it('picks the portal by the interface language', () => {
    expect(portalBase('zh-CN')).toBe('https://yaoagents.cn')
    expect(portalBase('zh-TW')).toBe('https://yaoagents.cn')
    expect(portalBase('en-US')).toBe('https://yaoagents.com')
    expect(portalBase('ja')).toBe('https://yaoagents.com')
  })

  it('keeps the entries that carry an address and fills the missing fields', () => {
    const servers = shapeCloudServers([
      { url: 'https://asia.example.com', name: '官方亚太', slug: 'apac', region: 'APAC', status: 'ok' },
      { url: 'https://slug-only.example.com', slug: 'cn' },
      { url: 'https://name-only.example.com', name: '官方中国' },
      { name: '没有地址' },
      { url: '' },
      null,
      'text',
    ])

    expect(servers).toEqual([
      { url: 'https://asia.example.com', name: '官方亚太', slug: 'apac', region: 'APAC', status: 'ok' },
      { url: 'https://slug-only.example.com', name: 'cn', slug: 'cn', region: undefined, status: undefined },
      { url: 'https://name-only.example.com', name: '官方中国', slug: '', region: undefined, status: undefined },
    ])
    expect(shapeCloudServers({ url: 'x' })).toEqual([])
  })

  it('asks the portal for the list in the given language', async () => {
    vi.mocked(transportFetchOk).mockResolvedValue(ok([{ url: 'https://asia.example.com', name: '官方亚太' }]))
    const result = await loadCloudServers('zh-CN', 'https://yaoagents.cn')

    expect(transportFetchOk).toHaveBeenCalledWith(
      'https://yaoagents.cn/v1/__yao/sui/v1/run/servers',
      expect.objectContaining({ method: 'POST', body: '{"method":"ServerList","args":["zh-CN"]}' }),
    )
    expect(result).toEqual({ ok: true, value: [{ url: 'https://asia.example.com', name: '官方亚太', slug: '', region: undefined, status: undefined }] })
  })

  it('reports a parse failure when the answer is not JSON', async () => {
    vi.mocked(transportFetchOk).mockResolvedValue({
      ok: true,
      value: new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }),
    })
    const result = await loadCloudServers('en-US', 'https://yaoagents.com')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('transport.parse')
  })

  it('passes the transport failure through untouched', async () => {
    vi.mocked(transportFetchOk).mockResolvedValue({ ok: false, code: 'transport.status', params: {}, message: 'boom' })
    expect(await loadCloudServers('en-US', 'https://yaoagents.com')).toEqual({
      ok: false,
      code: 'transport.status',
      params: {},
      message: 'boom',
    })
  })
})
