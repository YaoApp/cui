import { afterEach, describe, expect, it, vi } from 'vitest'
import { credential } from './index'
import {
  forgetService,
  loadSession,
  refreshSession,
  resetSession,
  sessionAuthorization,
  setSessionRefresher,
  signIn,
  signOut,
} from './session'

vi.mock('./index', () => ({
  credential: {
    managedByApp: vi.fn(() => true),
    read: vi.fn(async () => ({ ok: true as const, value: 'stored-token' })),
    write: vi.fn(async () => ({ ok: true as const, value: true })),
    remove: vi.fn(async () => ({ ok: true as const, value: true })),
    list: vi.fn(async () => ({ ok: true as const, value: [{ service: 'http://a:5099#session', account: '' }] })),
  },
}))
vi.mock('./scope', () => ({ credentialKey: (purpose: string) => `http://a:5099#${purpose}` }))

afterEach(() => {
  resetSession()
  setSessionRefresher(undefined)
  vi.clearAllMocks()
  /* `clearAllMocks` 只清调用记录，不清实现：把这一套按用例需要改过的默认值放回去 */
  vi.mocked(credential.managedByApp).mockReturnValue(true)
  vi.mocked(credential.write).mockResolvedValue({ ok: true, value: true })
  vi.mocked(credential.list).mockResolvedValue({ ok: true, value: [{ service: 'http://a:5099#session', account: '' }] })
})

describe('the session credential', () => {
  it('reads once, and hands the egress a bearer value', async () => {
    expect(sessionAuthorization()).toBeUndefined()
    expect(await loadSession()).toMatchObject({ ok: true, value: 'stored-token' })
    expect(sessionAuthorization()).toBe('Bearer stored-token')
    await loadSession()
    expect(credential.read).toHaveBeenCalledTimes(1)
  })

  it('reports a read that failed, and does not remember it as read', async () => {
    vi.mocked(credential.read).mockResolvedValueOnce({ ok: false, code: 'credential.keychain_denied', params: {}, message: 'no' })
    expect(await loadSession()).toMatchObject({ ok: false, code: 'credential.keychain_denied' })
    /* 再读一次真的再读：一次被拒不该被记成"这台机器没登录" */
    expect(await loadSession()).toMatchObject({ ok: true, value: 'stored-token' })
    expect(credential.read).toHaveBeenCalledTimes(2)
  })

  it('writes under the scoped key on sign in, and removes it on sign out', async () => {
    expect(await signIn({ access_token: 'fresh-token' })).toMatchObject({ ok: true, value: true })
    expect(credential.write).toHaveBeenCalledWith('http://a:5099#session', 'fresh-token')
    expect(sessionAuthorization()).toBe('Bearer fresh-token')
    expect(await signOut()).toMatchObject({ ok: true, value: true })
    expect(credential.remove).toHaveBeenCalledWith('http://a:5099#session')
    // 续期那条也要清：退出后库里不留任何能换新令牌的东西
    expect(credential.remove).toHaveBeenCalledWith('http://a:5099#refresh')
    expect(sessionAuthorization()).toBeUndefined()
  })

  it('forgets every credential of this origin, and nothing else', async () => {
    vi.mocked(credential.list).mockResolvedValue({
      ok: true,
      value: [
        { service: 'http://a:5099#session', account: '' },
        { service: 'http://b:5099#session', account: '' },
      ],
    })
    expect(await forgetService()).toMatchObject({ ok: true, value: 1 })
    expect(credential.remove).toHaveBeenCalledTimes(1)
    expect(credential.remove).toHaveBeenCalledWith('http://a:5099#session')
  })

  it('is a no-op where the carrier is not ours (a browser cookie)', async () => {
    vi.mocked(credential.managedByApp).mockReturnValue(false)
    const first = await loadSession()
    expect(first.ok ? first.value : 'unexpected').toBeUndefined()
    expect(await signIn({ access_token: 'x' })).toMatchObject({ ok: true, value: true })
    expect(credential.write).not.toHaveBeenCalled()
  })

  it('is a no-op when the response carries no token (a cookie carrier)', async () => {
    expect(await signIn({ status: 'ok' })).toMatchObject({ ok: true, value: true })
    expect(credential.write).not.toHaveBeenCalled()
    expect(sessionAuthorization()).toBeUndefined()
  })

  it('reports a write that failed, and does not keep the token in memory', async () => {
    vi.mocked(credential.write).mockResolvedValue({ ok: false, code: 'credential.write_failed', params: {}, message: 'no' })
    expect(await signIn({ access_token: 'fresh-token' })).toMatchObject({ ok: false, code: 'credential.write_failed' })
    expect(sessionAuthorization()).toBeUndefined()
  })

  it('stores the refresh token too, under its own purpose', async () => {
    await signIn({ access_token: 'access-token', refresh_token: 'refresh-token' })
    expect(credential.write).toHaveBeenCalledWith('http://a:5099#refresh', 'refresh-token')
  })

  it('ignores a payload that is not an object at all', async () => {
    expect(await signIn(42)).toMatchObject({ ok: true, value: true })
    expect(credential.write).not.toHaveBeenCalled()
  })

  it('reports a credential it could not delete on sign out', async () => {
    vi.mocked(credential.remove).mockResolvedValue({ ok: false, code: 'credential.remove_failed', params: {}, message: 'no' })
    await signIn({ access_token: 'fresh-token' })
    expect(await signOut()).toMatchObject({ ok: false, code: 'credential.remove_failed' })
    /* 内存镜像照清：这一次打开里不该再拿它去发请求 */
    expect(sessionAuthorization()).toBeUndefined()
  })

  it('forgets nothing where the carrier is not ours, or when the list fails', async () => {
    vi.mocked(credential.managedByApp).mockReturnValue(false)
    expect(await forgetService()).toMatchObject({ ok: true, value: 0 })

    vi.mocked(credential.managedByApp).mockReturnValue(true)
    vi.mocked(credential.list).mockResolvedValue({ ok: false, code: 'transport.network', params: {}, message: 'down' })
    expect(await forgetService()).toMatchObject({ ok: false, code: 'transport.network' })

    vi.mocked(credential.list).mockResolvedValue({ ok: true, value: [{ service: 'http://a:5099#session', account: '' }] })
    vi.mocked(credential.remove).mockResolvedValue({ ok: true, value: false })
    expect(await forgetService()).toMatchObject({ ok: true, value: 0 })
  })

  /* 续期那条线的接线：产品里还没有调用点，这里钉住它的行为，接上时不用重新想 */
  it('has no refresher until one is injected, and keeps it across a mirror reset', async () => {
    expect(await refreshSession()).toMatchObject({ ok: false, code: 'credential.service_empty' })

    const refresh = vi.fn(async () => ({ ok: true as const, value: 'new-token' }))
    setSessionRefresher(refresh)
    /* 没登录时照样不发刷新 */
    expect(await refreshSession()).toMatchObject({ ok: false, code: 'credential.service_empty' })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('asks the injected refresher once for a burst of callers', async () => {
    let release: (value: { ok: true; value: string }) => void = () => {}
    const refresh = vi.fn(
      () =>
        new Promise<{ ok: true; value: string }>((resolve) => {
          release = resolve
        }),
    )
    setSessionRefresher(refresh)
    await signIn({ access_token: 'fresh-token' })

    const all = Promise.all([refreshSession(), refreshSession(), refreshSession()])
    release({ ok: true, value: 'new-token' })
    for (const result of await all) expect(result).toMatchObject({ ok: true, value: 'new-token' })
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
