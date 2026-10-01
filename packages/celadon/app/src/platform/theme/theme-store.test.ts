import { describe, expect, it } from 'vitest'
import { useThemeStore } from '@/platform/theme/theme-store'

/* 主题只做一件事：写根元素的 data-theme。store 是唯一写它的地方。 */
describe('theme store', () => {
  it('starts light and writes that to the root element', () => {
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggles between the two themes and applies each', () => {
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('remembers the choice', () => {
    useThemeStore.getState().setTheme('dark')
    expect(window.localStorage.getItem('cui.theme')).toContain('dark')
  })
})
