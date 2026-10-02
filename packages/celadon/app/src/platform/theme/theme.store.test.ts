import { describe, expect, it } from 'vitest'
import { useThemeStore } from '@/platform/theme/theme.store'

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

/* 这一条**故意依赖执行顺序**：上一条把主题设成了 dark，如果测试支持里的自动复位失效，
   这里就会读到 dark —— 于是它成了那张网自己是否还在的证明。 */
it('is reset between tests, so one test cannot leak a theme into the next', () => {
  expect(useThemeStore.getState().theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})
