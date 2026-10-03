import { afterEach, describe, expect, it, vi } from 'vitest'
import { system, SYSTEM_COMMANDS } from './system'

function asHost(invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('system', () => {
  it('is unavailable in a browser for every call', async () => {
    const calls = [
      system.platform(),
      system.language(),
      system.localIps(),
      system.openBrowser('https://example.com'),
      system.reveal('/tmp'),
      system.folderPick(),
      system.filePick(),
      system.appInfo(),
      system.theme(),
      system.themeSet('dark'),
      system.machineId(),
    ]
    for (const call of await Promise.all(calls)) {
      expect(call).toMatchObject({ ok: false, code: 'bridge.unavailable' })
    }
  })

  it('names every command exactly as the host does', async () => {
    const seen: string[] = []
    asHost(async (command) => {
      seen.push(command)
      return null
    })
    await system.platform()
    await system.language()
    await system.localIps()
    await system.openBrowser('https://example.com')
    await system.reveal('/tmp')
    await system.folderPick('pick a folder')
    await system.filePick('pick a file')
    await system.appInfo()
    await system.theme()
    await system.machineId()
    await system.themeSet('light')
    expect(seen).toEqual(Object.values(SYSTEM_COMMANDS))
  })

  it('passes the arguments the host expects', async () => {
    const args: Record<string, unknown>[] = []
    asHost(async (_command, next) => {
      args.push(next ?? {})
      return null
    })
    await system.openBrowser('https://example.com')
    await system.reveal('/tmp/x')
    await system.folderPick()
    await system.filePick('pick')
    await system.themeSet('dark')
    expect(args).toEqual([
      { url: 'https://example.com' },
      { path: '/tmp/x' },
      { title: null },
      { title: 'pick' },
      { theme: 'dark' },
    ])
  })

  it('keeps the code and params the host reported', async () => {
    asHost(async () => {
      // Tauri 会把 Rust 的 `BridgeError` 序列化成拒绝值
      throw { code: 'theme.expected_light_or_dark', params: { value: 'system' }, message: 'theme: expected light or dark' }
    })
    const result = await system.themeSet('light')
    expect(result).toMatchObject({
      ok: false,
      code: 'theme.expected_light_or_dark',
      params: { value: 'system' },
    })
  })
})
