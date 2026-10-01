import { describe, expect, it } from 'vitest'
import { useThemeStore } from '@/platform/theme/theme-store'

/* 主题只做一件事：写根元素的 data-theme。store 是唯一写它的地方。 */
describe('theme store', () => {
  it('starts light and writes that to the root element', () => {
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('applies each theme to the root element', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('remembers the choice', () => {
    useThemeStore.getState().setTheme('dark')
    expect(window.localStorage.getItem('cui.theme')).toContain('dark')
  })
})
