import { describe, expect, it, vi } from 'vitest'
import { assertThemeContrast } from '@/platform/theme/assert-contrast'

const stubTokens = (bg: string, fg: string) => {
  const original = window.getComputedStyle
  window.getComputedStyle = ((_el: Element) => ({
    getPropertyValue: (prop: string) =>
      prop === '--background-app' ? bg : prop === '--text-primary' ? fg : '',
  })) as unknown as typeof window.getComputedStyle
  return () => {
    window.getComputedStyle = original
  }
}

describe('assertThemeContrast', () => {
  it('warns when the text cannot be read on the page background', () => {
    const restore = stubTokens('#FFFFFF', '#FEFEFE')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    assertThemeContrast()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
    restore()
  })

  it('stays quiet when the pair reads', () => {
    const restore = stubTokens('#FFFFFF', '#121110')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    assertThemeContrast()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    restore()
  })
})
