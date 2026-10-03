import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadServiceInfo, parseServiceInfo, resetServiceInfo, serviceInfo } from './info'

const PAYLOAD = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }

function respondWith(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetServiceInfo()
})

describe('loadServiceInfo', () => {
  it('reads the well-known once and then answers from the cache', async () => {
    const fetchMock = respondWith(PAYLOAD)
    const first = await loadServiceInfo()
    const second = await loadServiceInfo()
    expect(first).toMatchObject({ ok: true, value: PAYLOAD })
    expect(second).toMatchObject({ ok: true, value: PAYLOAD })
    expect(fetchMock).toHaveBeenCalledTimes(1)          // 第二次不许再请求
    expect(serviceInfo()).toMatchObject(PAYLOAD)
    // **根相对**：后端真实路由就是这个（dev 由 dev server 代转，见 16 §1）
    expect(fetchMock.mock.calls[0][0]).toBe('/.well-known/yao')
  })

  it('turns an unreachable service into a readable code, not a throw', async () => {
    respondWith({}, 404)
    const result = await loadServiceInfo()
    expect(result).toMatchObject({ ok: false, code: 'service.unavailable', params: { status: 404 } })
  })

  it('refuses a body that is not the shape the interface promises', async () => {
    respondWith({ name: 'Yao Agents' })
    const result = await loadServiceInfo()
    expect(result).toMatchObject({ ok: false, code: 'service.malformed' })
    expect(serviceInfo()).toBeUndefined()
  })

  it('does not cache a failure: the next call asks again', async () => {
    const fetchMock = respondWith({}, 500)
    await loadServiceInfo()
    expect(serviceInfo()).toBeUndefined()
    await loadServiceInfo()
    expect(fetchMock).toHaveBeenCalledTimes(2)   // 失败不入缓存 → 会再问（这条才判别"不缓存"）
  })

  it('asks once even when two calls arrive together', async () => {
    const fetchMock = respondWith(PAYLOAD)
    const [a, b] = await Promise.all([loadServiceInfo(), loadServiceInfo()])
    expect(a.ok && b.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)   // 并发去重（StrictMode 会并发调）
  })
})

describe('parseServiceInfo', () => {
  it('insists on an openapi root that starts at the root', () => {
    expect(parseServiceInfo(PAYLOAD).ok).toBe(true)
    expect(parseServiceInfo({ openapi: 'v1' })).toMatchObject({ ok: false, code: 'service.malformed' })
    // 协议相对地址（`//evil.example/v1`）会把请求带出站 —— 必须拒
    expect(parseServiceInfo({ openapi: '//evil.example/v1' })).toMatchObject({ ok: false, code: 'service.malformed' })
    expect(parseServiceInfo(null)).toMatchObject({ ok: false, code: 'service.malformed' })
  })
})
