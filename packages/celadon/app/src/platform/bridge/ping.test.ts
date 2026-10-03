import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasHost } from './invoke'
import { ping, PING_COMMAND } from './ping'

/* 三条路径：没有宿主 · 宿主正常 · 命令不存在（都**不抛**，都是值）。 */

function asHost(invoke: (command: string) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ping', () => {
  it('is unavailable in a browser, and says so without throwing', async () => {
    expect(hasHost()).toBe(false)
    const result = await ping()
    expect(result).toMatchObject({ ok: false, code: 'bridge.unavailable' })
  })

  it('asks the host by the exact command name and returns its answer', async () => {
    const invoke = vi.fn(async (command: string) => {
      expect(command).toBe('celadon_ping')
      return { available: true, version: '2.0.0', commands: { [PING_COMMAND]: true } }
    })
    asHost(invoke)
    const result = await ping()
    expect(result.ok && result.value.version).toBe('2.0.0')
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('reports a missing command as not-running rather than throwing', async () => {
    asHost(async () => {
      throw new Error('command celadon_ping not found')
    })
    expect(await ping()).toMatchObject({ ok: false, code: 'bridge.not_running' })
  })
})
