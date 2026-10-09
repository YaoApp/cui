/* 入口判定：表里每一行一条用例（`plan/06-login.md` §5）。 */
import { describe, expect, it } from 'vitest'
import { resolveEntry } from './entry'

const base = { needsServer: false, mode: 'standalone' as const, signedIn: true, ready: true }

describe('resolveEntry', () => {
  it('goes to the server picker when the desktop has no address yet', () => {
    expect(resolveEntry({ ...base, needsServer: true, signedIn: false, landing: '/x' })).toBe('/servers')
  })

  it('goes to the sign-in page when this machine is not signed in', () => {
    expect(resolveEntry({ ...base, signedIn: false })).toBe('/login')
  })

  it('goes to the last landing when there is one', () => {
    expect(resolveEntry({ ...base, landing: '/scaffold/base?q=alpha' })).toBe('/scaffold/base?q=alpha')
  })

  it('goes to the welcome page when there is no landing', () => {
    expect(resolveEntry({ ...base, landing: undefined })).toBe('/welcome')
  })

  it('goes to the welcome page when the follow-up logic says it is not ready', () => {
    expect(resolveEntry({ ...base, ready: false, landing: '/scaffold/base' })).toBe('/welcome')
  })

  it('keeps the client chrome on the paths it decides', () => {
    expect(resolveEntry({ ...base, mode: 'in-app', signedIn: false })).toBe('/login?from=connect')
    expect(resolveEntry({ ...base, mode: 'in-app', landing: undefined })).toBe('/welcome?from=connect')
    expect(resolveEntry({ ...base, mode: 'in-app', needsServer: true })).toBe('/servers')
  })
})
