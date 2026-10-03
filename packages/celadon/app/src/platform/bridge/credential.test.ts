import { afterEach, describe, expect, it, vi } from 'vitest'
import { credential, CREDENTIAL_COMMANDS } from './credential'

/* 名字与参数要对得上 Rust；失败是值；浏览器里一律 unavailable。 */

function asHost(invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('credential', () => {
  it('says unavailable in a browser, for every command', async () => {
    for (const call of [
      credential.list(),
      credential.read('srv'),
      credential.write('srv', 'secret'),
      credential.remove('srv'),
    ]) {
      expect(await call).toMatchObject({ ok: false, code: 'bridge.unavailable' })
    }
  })

  it('names the commands exactly as the host does', async () => {
    const seen: string[] = []
    asHost(async (command) => {
      seen.push(command)
      return true
    })
    await credential.write('srv-a', 'secret')
    await credential.read('srv-a')
    await credential.remove('srv-a')
    await credential.list()
    expect(seen).toEqual([
      CREDENTIAL_COMMANDS.write,
      CREDENTIAL_COMMANDS.read,
      CREDENTIAL_COMMANDS.remove,
      CREDENTIAL_COMMANDS.list,
    ])
  })

  it('passes the service name and the secret the host expects', async () => {
    const args: Record<string, unknown>[] = []
    asHost(async (_command, next) => {
      args.push(next ?? {})
      return true
    })
    await credential.write('srv-a', 'secret', 'me@example.com')
    expect(args[0]).toEqual({ service: 'srv-a', secret: 'secret', account: 'me@example.com' })
  })

  it('gives back an empty account by default', async () => {
    const args: Record<string, unknown>[] = []
    asHost(async (_command, next) => {
      args.push(next ?? {})
      return true
    })
    await credential.write('srv-a', 'secret')
    expect(args[0]).toEqual({ service: 'srv-a', secret: 'secret', account: '' })
  })

  it('reports the host refusal as a value, not as a throw', async () => {
    asHost(async () => {
      throw new Error('credential store: Platform failure')
    })
    expect(await credential.read('srv-a')).toMatchObject({ ok: false, code: 'bridge.rejected' })
  })
})
