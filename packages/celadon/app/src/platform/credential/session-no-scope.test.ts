/* 还没有服务地址时（桌面刚打开、还没选服务器）：没有可挂靠的键，凭据的读写一律空操作。
   这一组单独一个文件，因为 `./scope` 的桩要整份换掉。 */
import { describe, expect, it, vi } from 'vitest'
import { credential } from './index'
import { forgetService, loadSession, sessionAuthorization, signIn, signOut } from './session'

vi.mock('./index', () => ({
  credential: {
    managedByApp: vi.fn(() => true),
    read: vi.fn(async () => ({ ok: true as const, value: 'stored-token' })),
    write: vi.fn(async () => ({ ok: true as const, value: true })),
    remove: vi.fn(async () => ({ ok: true as const, value: true })),
    list: vi.fn(async () => ({ ok: true as const, value: [] })),
  },
}))
vi.mock('./scope', () => ({ credentialKey: () => undefined }))

describe('the session credential without a service address', () => {
  it('has nowhere to keep it: reads and writes are no-ops', async () => {
    expect(await loadSession()).toMatchObject({ ok: true, value: undefined })
    expect(await signIn({ access_token: 'x' })).toMatchObject({ ok: true, value: true })
    expect(credential.write).not.toHaveBeenCalled()
    expect(sessionAuthorization()).toBeUndefined()
  })

  it('has nothing to delete on sign out, and nothing to forget', async () => {
    expect(await signOut()).toMatchObject({ ok: true, value: true })
    expect(credential.remove).not.toHaveBeenCalled()
    expect(await forgetService()).toMatchObject({ ok: true, value: 0 })
    expect(credential.list).not.toHaveBeenCalled()
  })
})
