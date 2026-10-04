import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* 客户端事实：一处装填（清单 · 能力 · 宿主 · id），装填之后同步读；宿主答不上来即不可继续。 */
const hasHost = vi.hoisted(() => vi.fn(() => false))
const ping = vi.hoisted(() => vi.fn())
const machineId = vi.hoisted(() => vi.fn())

vi.mock('../bridge/invoke', () => ({ hasHost }))
vi.mock('../bridge/ping', () => ({ ping }))
vi.mock('../bridge/system', () => ({ system: { machineId } }))

const store = new Map<string, string>()

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  })
  vi.doMock('@/platform/manifest.json', () => ({
    default: { version: '2.0.0', client: 'desktop', os: 'macos', artifact: 'unified', locales: ['zh-CN'], build: { commit: 'dev', at: '', by: '' } },
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('@/platform/manifest.json')
})

describe('loadClient', () => {
  it('fills the host facts on the desktop and leaves the id a machine code', async () => {
    hasHost.mockReturnValue(true)
    ping.mockResolvedValue({ ok: true, value: { available: true, version: '2.0.0', commands: {} } })
    machineId.mockResolvedValue({ ok: true, value: '19046aa7-387a' })
    const { client, loadClient } = await import('./facts')

    await loadClient()

    expect(client.host).toEqual({ ready: true, version: '2.0.0' })
    expect(client.id).toBe('desk-19046aa7-387a')
    expect(client.info.client_id).toBe('desk-19046aa7-387a')
    expect(client.signature.startsWith('desktop/macos/')).toBe(true)
    expect(ping).toHaveBeenCalledTimes(1)
  })

  it('is idempotent:装填一次，重复调用不再问宿主', async () => {
    hasHost.mockReturnValue(true)
    ping.mockResolvedValue({ ok: true, value: { available: true, version: '2.0.0', commands: {} } })
    machineId.mockResolvedValue({ ok: true, value: 'machine' })
    const { loadClient } = await import('./facts')

    await Promise.all([loadClient(), loadClient()])

    expect(ping).toHaveBeenCalledTimes(1)
    expect(machineId).toHaveBeenCalledTimes(1)
  })

  it('refuses to continue when the host does not answer (no random fallback)', async () => {
    hasHost.mockReturnValue(true)
    ping.mockResolvedValue({ ok: false, code: 'bridge.unavailable', params: {}, message: 'no host' })
    const { loadClient, ClientBootError } = await import('./facts')

    await expect(loadClient()).rejects.toBeInstanceOf(ClientBootError)
    await expect(loadClient()).rejects.toMatchObject({ code: 'client.host_unavailable' })
  })

  it('refuses when the machine id is unavailable', async () => {
    hasHost.mockReturnValue(true)
    ping.mockResolvedValue({ ok: true, value: { available: true, version: '2.0.0', commands: {} } })
    machineId.mockResolvedValue({ ok: false, code: 'bridge.unavailable', params: {}, message: 'no' })
    const { loadClient } = await import('./facts')

    await expect(loadClient()).rejects.toMatchObject({ code: 'client.machine_id_unavailable' })
  })

  it('times out instead of hanging on a silent host', async () => {
    hasHost.mockReturnValue(true)
    ping.mockReturnValue(new Promise(() => {}))
    const { loadClient } = await import('./facts')
    const waiting = loadClient()
    await vi.waitFor(async () => {
      await expect(waiting).rejects.toMatchObject({ code: 'client.host_timeout' })
    }, { timeout: 12_000 })
  }, 15_000)

  it('on the web there is no host: ready stays false and nothing is asked', async () => {
    vi.doMock('@/platform/manifest.json', () => ({
      default: { version: '2.0.0', client: 'web', os: '', artifact: 'web', locales: ['zh-CN'], build: { commit: 'dev', at: '', by: '' } },
    }))
    hasHost.mockReturnValue(false)
    const { client, loadClient } = await import('./facts')

    await loadClient()

    expect(client.host).toEqual({ ready: false, version: '' })
    expect(client.id.startsWith('web-')).toBe(true)
    expect(ping).not.toHaveBeenCalled()
    expect(client.capabilities.serviceAddress).toBe(false)
  })
})
