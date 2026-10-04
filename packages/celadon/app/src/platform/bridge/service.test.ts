import { afterEach, describe, expect, it, vi } from 'vitest'
import { service, SERVICE_COMMANDS } from './service'

function asHost(invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('service', () => {
  it('is unavailable in a browser for both calls', async () => {
    const calls = [service.get(), service.set('http://localhost:5099')]
    for (const call of await Promise.all(calls)) {
      expect(call).toMatchObject({ ok: false, code: 'bridge.unavailable' })
    }
  })

  it('asks the host for the address, and hands it the one to write', async () => {
    const invoke = vi.fn(async () => ({ url: 'http://localhost:5099' }))
    asHost(invoke)

    expect(await service.get()).toMatchObject({ ok: true, value: { url: 'http://localhost:5099' } })
    expect(invoke).toHaveBeenCalledWith(SERVICE_COMMANDS.get, undefined)

    expect(await service.set('localhost:5099')).toMatchObject({ ok: true, value: { url: 'http://localhost:5099' } })
    expect(invoke).toHaveBeenLastCalledWith(SERVICE_COMMANDS.set, { url: 'localhost:5099' })
  })

  it('keeps a host refusal as a value, with the code the host gave', async () => {
    asHost(async () => {
      throw { code: 'service.unreachable', params: { url: 'http://x' }, message: 'cannot reach http://x' }
    })
    const failed = await service.set('http://x')
    expect(failed).toMatchObject({ ok: false, code: 'service.unreachable', params: { url: 'http://x' } })
  })
})
