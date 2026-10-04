import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adoptMachineId, clientId, randomId, storedMachineId } from './client-id'

/* 前缀由清单决定；本文件里可切（默认 web，adopt 那条切成 desktop）*/
const buildKind = vi.hoisted(() => ({ value: 'web' }))
vi.mock('./manifest', () => ({ clientKind: () => buildKind.value }))

/* `client_id`：内存 → 本地存储 → 新建；桌面装填时由 `adoptMachineId` 换成机器码。 */
const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('client_id', () => {
  it('makes a value once and keeps it in local storage', () => {
    const first = clientId()
    expect(first).toMatch(/^web-[0-9a-z]{16}$/)
    expect(store.get('celadon.client_id')).toBe(first)
    expect(clientId()).toBe(first)
  })

  it('takes the host machine code when the desktop adopts it', () => {
    buildKind.value = 'desktop'
    const id = adoptMachineId('19046aa7-387a')
    expect(id).toBe('desk-19046aa7-387a')
    expect(store.get('celadon.client_id')).toBe(id)
    expect(storedMachineId()).toBe(id)
  })

  it('generates random segments without crypto.randomUUID (non-secure contexts)', () => {
    vi.stubGlobal('crypto', undefined)
    expect(randomId(8)).toMatch(/^[0-9a-z]{8}$/)
  })
})
