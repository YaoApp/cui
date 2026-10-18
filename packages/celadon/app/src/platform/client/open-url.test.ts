import { describe, expect, it, vi } from 'vitest'

const kind = vi.hoisted(() => ({ value: 'web' }))
const openBrowser = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('./facts', () => ({ client: { get kind() { return kind.value } } }))
vi.mock('../bridge', () => ({ system: { openBrowser } }))

import { openUrl } from './open-url'

describe('openUrl', () => {
  it('opens a new tab on the web', () => {
    kind.value = 'web'
    const open = vi.fn()
    const original = globalThis.open
    globalThis.open = open as unknown as typeof globalThis.open

    openUrl('https://yaoagents.com/pricing')

    expect(open).toHaveBeenCalledWith('https://yaoagents.com/pricing', '_blank', 'noopener,noreferrer')
    expect(openBrowser).not.toHaveBeenCalled()
    globalThis.open = original
  })

  it('hands the url to the host on the desktop', () => {
    kind.value = 'desktop'
    const open = vi.fn()
    const original = globalThis.open
    globalThis.open = open as unknown as typeof globalThis.open

    openUrl('https://yaoagents.com/pricing')

    expect(openBrowser).toHaveBeenCalledWith('https://yaoagents.com/pricing')
    expect(open).not.toHaveBeenCalled()
    globalThis.open = original
    kind.value = 'web'
  })
})
