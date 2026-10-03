import { describe, expect, it, vi } from 'vitest'
import { bridgeErrorText, codeToKey } from './translate'
import type { BridgeFailure } from './result'

const failure: BridgeFailure = {
  ok: false,
  code: 'theme.expected_light_or_dark',
  params: { value: 'system' },
  message: 'theme: expected light or dark, got "system"',
}

describe('bridgeErrorText', () => {
  it('asks for the key the code names, and passes the params', () => {
    const t = vi.fn((key: string) => (key === 'bridge.error.theme.expectedLightOrDark' ? '主题只支持浅色或深色' : key))
    expect(bridgeErrorText(t, failure)).toBe('主题只支持浅色或深色')
    expect(t).toHaveBeenCalledWith('bridge.error.theme.expectedLightOrDark', { value: 'system' })
  })

  it('turns a machine code into the key convention the packs use', () => {
    expect(codeToKey('theme.expected_light_or_dark')).toBe('theme.expectedLightOrDark')
    expect(codeToKey('bridge.unavailable')).toBe('bridge.unavailable')
    expect(codeToKey('credential.no_entry')).toBe('credential.noEntry')
  })

  it('falls back to the diagnostic message and warns when the pack has no key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const t = (key: string) => key // 缺翻译时 i18next 原样返回 key
    expect(bridgeErrorText(t, failure)).toBe(failure.message)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('never shows an empty string when there is no message either', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const t = (key: string) => key
    expect(bridgeErrorText(t, { ...failure, message: '' })).toBe(failure.code)
    warn.mockRestore()
  })
})
