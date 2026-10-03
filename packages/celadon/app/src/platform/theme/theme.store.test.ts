import { describe, expect, it } from 'vitest'
import {
  coerceThemePreference,
  resolveTheme,
  systemPrefersDark,
  useThemeStore,
} from '@/platform/theme/theme.store'

/* 解析是纯函数：偏好 + 系统状态 → 实际主题。 */
describe('resolveTheme', () => {
  it('follows the system when the preference is system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('keeps an explicit preference whatever the system says', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

/* store 是唯一写 data-theme 的地方；组件只读解析后的 theme。 */
describe('theme store', () => {
  it('starts on system and resolves it', () => {
    expect(useThemeStore.getState().preference).toBe('system')
    expect(['light', 'dark']).toContain(useThemeStore.getState().theme)
    expect(document.documentElement.dataset.theme).toBe(useThemeStore.getState().theme)
  })

  it('writes an explicit preference to the root element', () => {
    useThemeStore.getState().setPreference('dark')
    expect(useThemeStore.getState().preference).toBe('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    useThemeStore.getState().setPreference('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('lets the switcher write an explicit preference through setTheme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().preference).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('follows the system again when the preference goes back to system', () => {
    useThemeStore.getState().setPreference('dark')
    useThemeStore.getState().setPreference('system')
    const expected = resolveTheme('system', window.matchMedia('(prefers-color-scheme: dark)').matches)
    expect(useThemeStore.getState().theme).toBe(expected)
    expect(document.documentElement.dataset.theme).toBe(expected)
  })

  it('remembers the preference', () => {
    useThemeStore.getState().setPreference('dark')
    expect(window.localStorage.getItem('cui.theme')).toContain('dark')
  })
})

/* 这一条**故意依赖执行顺序**：上一条把偏好设成了 dark，如果测试支持里的自动复位失效，
   这里就会读到 dark —— 于是它成了那张网自己是否还在的证明。 */
it('is reset between tests, so one test cannot leak a preference into the next', () => {
  const state = useThemeStore.getState()
  expect(state.preference).toBe('system')
  expect(document.documentElement.dataset.theme).toBe(state.theme)
})

/* `system` 态读的是系统偏好；实时跟随由浏览器用例验证（那里能改系统偏好）。 */
it('reads the system preference rather than a value of its own', () => {
  useThemeStore.getState().setPreference('dark')
  useThemeStore.getState().setPreference('system')
  expect(useThemeStore.getState().theme).toBe(resolveTheme('system', systemPrefersDark()))
})

it('does not follow once the preference is explicit', () => {
  useThemeStore.getState().setPreference('light')
  expect(useThemeStore.getState().theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

/* 同语言：存储里的非法偏好不许写到 data-theme 上。 */
describe('coerceThemePreference', () => {
  it('keeps the three legal choices', () => {
    expect(coerceThemePreference('system')).toBe('system')
    expect(coerceThemePreference('light')).toBe('light')
    expect(coerceThemePreference('dark')).toBe('dark')
  })

  it('falls back for anything else', () => {
    expect(coerceThemePreference('blue')).toBe('system')
    expect(coerceThemePreference(undefined)).toBe('system')
    expect(coerceThemePreference(null)).toBe('system')
  })
})

/* **水合路径**：同上，纯函数测不到 `merge`。 */
describe('theme store · hydration', () => {
  it('falls back when the stored preference is unknown', async () => {
    window.localStorage.setItem('cui.theme', JSON.stringify({ state: { preference: 'blue' }, version: 1 }))
    await useThemeStore.persist.rehydrate()
    expect(useThemeStore.getState().preference).toBe('system')
  })

  it('keeps the old shape by migrating it to a preference', async () => {
    window.localStorage.setItem('cui.theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
    await useThemeStore.persist.rehydrate()
    expect(useThemeStore.getState().preference).toBe('dark')
  })
})
