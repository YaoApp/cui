import { afterEach, describe, expect, it, vi } from 'vitest'
import { service } from '../bridge/service'
import { readServiceAddress, writeServiceAddress } from './address'

vi.mock('../bridge/service', () => ({ service: { get: vi.fn(), set: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

describe('the service address faces', () => {
  it('reads the url the host holds', async () => {
    vi.mocked(service.get).mockResolvedValue({ ok: true, value: { url: 'http://a:5099' } })
    expect(await readServiceAddress()).toEqual({ ok: true, value: 'http://a:5099' })
  })

  it('writes through, and hands a refusal back untouched', async () => {
    vi.mocked(service.set).mockResolvedValue({ ok: true, value: { url: 'http://b:5099' } })
    expect(await writeServiceAddress('http://b:5099')).toEqual({ ok: true, value: 'http://b:5099' })
    const refused = { ok: false as const, code: 'service.unreachable', params: {}, message: 'no' }
    vi.mocked(service.set).mockResolvedValue(refused)
    expect(await writeServiceAddress('http://c:5099')).toEqual(refused)
  })
})
