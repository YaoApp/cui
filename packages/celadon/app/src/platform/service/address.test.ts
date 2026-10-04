import { afterEach, describe, expect, it, vi } from 'vitest'
import { service } from '../bridge/service'
import { readServiceAddress, writeServiceAddress } from './address'

vi.mock('../bridge/service', () => ({ service: { get: vi.fn(), set: vi.fn() } }))
vi.mock('./base', () => ({ resetServiceBase: vi.fn() }))
vi.mock('./info', () => ({ resetServiceInfo: vi.fn() }))
vi.mock('../credential/session', () => ({ resetSession: vi.fn(), loadSession: vi.fn(async () => ({ ok: true, value: undefined })) }))
import { resetServiceBase } from './base'
import { resetServiceInfo } from './info'
import { loadSession, resetSession } from '../credential/session'

afterEach(() => vi.clearAllMocks())

describe('the service address faces', () => {
  it('reads the url the host holds', async () => {
    vi.mocked(service.get).mockResolvedValue({ ok: true, value: { url: 'http://a:5099' } })
    expect(await readServiceAddress()).toEqual({ ok: true, value: 'http://a:5099' })
  })

    it('throws away the old service caches when the address changes', async () => {
      vi.mocked(service.set).mockResolvedValue({ ok: true, value: { url: 'http://b:5099' } })

      await writeServiceAddress('http://b:5099')

      // 换地址就是换服务：旧基址、旧服务文档、旧会话镜像都得作废，再按新地址读一次会话
      expect(resetServiceBase).toHaveBeenCalledTimes(1)
      expect(resetServiceInfo).toHaveBeenCalledTimes(1)
      expect(resetSession).toHaveBeenCalledTimes(1)
      expect(loadSession).toHaveBeenCalledTimes(1)
    })
  it('writes through, and hands a refusal back untouched', async () => {
    vi.mocked(service.set).mockResolvedValue({ ok: true, value: { url: 'http://b:5099' } })
    expect(await writeServiceAddress('http://b:5099')).toEqual({ ok: true, value: 'http://b:5099' })
    const refused = { ok: false as const, code: 'service.unreachable', params: {}, message: 'no' }
    vi.mocked(service.set).mockResolvedValue(refused)
    expect(await writeServiceAddress('http://c:5099')).toEqual(refused)
  })
})
