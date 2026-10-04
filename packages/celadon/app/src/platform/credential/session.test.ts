import { afterEach, describe, expect, it, vi } from 'vitest'
import { credential } from './index'
import { forgetService, loadSession, resetSession, sessionAuthorization, signIn, signOut } from './session'

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
  vi.clearAllMocks()
})

describe('the session credential', () => {
  it('reads once, and hands the egress a bearer value', async () => {
    expect(sessionAuthorization()).toBeUndefined()
    expect(await loadSession()).toMatchObject({ ok: true, value: 'stored-token' })
    expect(sessionAuthorization()).toBe('Bearer stored-token')
    await loadSession()
    expect(credential.read).toHaveBeenCalledTimes(1)
  })

  it('writes under the scoped key on sign in, and removes it on sign out', async () => {
    expect(await signIn('fresh-token')).toMatchObject({ ok: true, value: true })
    expect(credential.write).toHaveBeenCalledWith('http://a:5099#session', 'fresh-token')
    expect(sessionAuthorization()).toBe('Bearer fresh-token')
    expect(await signOut()).toMatchObject({ ok: true, value: true })
    expect(credential.remove).toHaveBeenCalledWith('http://a:5099#session')
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
    expect(await signIn('x')).toMatchObject({ ok: true, value: true })
    expect(credential.write).not.toHaveBeenCalled()
  })
})
